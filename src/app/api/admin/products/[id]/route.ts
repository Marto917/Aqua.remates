import { CatalogVisibility, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { categorySlugFromName } from "@/lib/categories";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { saveCompressedProductImage } from "@/lib/save-product-image";

function parseScale(value: FormDataEntryValue | null): number | undefined {
  if (value == null) return undefined;
  const n = Number(String(value));
  if (!Number.isFinite(n)) return undefined;
  return Math.min(1.5, Math.max(0.8, n));
}

const updateAvailabilitySchema = z.object({
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});
const updateVisibilitySchema = z.object({
  catalogVisibility: z.nativeEnum(CatalogVisibility),
});

const updateCategorySchema = z.object({
  categoryName: z.string().trim().min(2).max(40),
});

function parseNumericInput(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const raw = value.trim().replace(/\s+/g, "").replace(/\$/g, "");
  const normalized = raw.includes(",") && !raw.includes(".") ? raw.replace(",", ".") : raw;
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

const updateDetailsSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().max(64).optional(),
  supplierName: z.string().trim().optional(),
  description: z.string().optional(),
  categoryName: z.string().trim().min(2).max(40),
  listPrice: z.preprocess(parseNumericInput, z.number().positive()),
  wholesalePrice: z.preprocess(
    (v) => (v === "" || v == null ? undefined : parseNumericInput(v)),
    z.number().nonnegative().optional(),
  ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSafeSession();
  const canManage =
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE;
  if (!canManage) {
    const url = new URL("/admin/productos", req.url);
    url.searchParams.set(
      "error",
      "No autorizado. Configura BACKOFFICE_PREVIEW en el hosting o inicia sesion como staff.",
    );
    return NextResponse.redirect(url);
  }

  const { id } = await params;
  const formData = await req.formData();
  const intent = String(formData.get("intent") ?? "toggle_active");

  if (intent === "update_images") {
    const clearProductImage = formData.get("clearProductImage") === "on";
    const productImageFile = formData.get("productImageFile");
    let productImageUrl: string | undefined;

    if (clearProductImage) {
      productImageUrl = DEFAULT_PRODUCT_IMAGE;
    } else if (productImageFile instanceof File && productImageFile.size > 0) {
      try {
        const buffer = Buffer.from(await productImageFile.arrayBuffer());
        productImageUrl = await saveCompressedProductImage(buffer);
      } catch (error) {
        const url = new URL(`/admin/productos/${id}`, req.url);
        url.searchParams.set(
          "error",
          error instanceof Error ? error.message : "No se pudo procesar la imagen del producto.",
        );
        return NextResponse.redirect(url);
      }
    }

    const productPosition = String(formData.get("productImagePosition") ?? "").trim();
    const productScale = parseScale(formData.get("productImageScale"));
    const productUpdates: { imageUrl?: string; imagePosition?: string; imageScale?: number } = {};

    if (productImageUrl) {
      productUpdates.imageUrl = productImageUrl;
    }
    if (productPosition) {
      productUpdates.imagePosition = productPosition;
    }
    if (productScale != null) {
      productUpdates.imageScale = productScale;
    }
    if (Object.keys(productUpdates).length > 0) {
      await prisma.product.update({ where: { id }, data: productUpdates });
    }

    const variantEntries = Array.from(formData.entries()).filter(([key]) =>
      key.startsWith("variantImage_"),
    );

    for (const [key, value] of variantEntries) {
      if (!(value instanceof File) || value.size === 0) continue;
      const variantId = key.replace("variantImage_", "");
      try {
        const buffer = Buffer.from(await value.arrayBuffer());
        const imageUrl = await saveCompressedProductImage(buffer);
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { imageUrl },
        });
      } catch (error) {
        const url = new URL(`/admin/productos/${id}`, req.url);
        url.searchParams.set(
          "error",
          error instanceof Error ? error.message : "No se pudo procesar una imagen de variante.",
        );
        return NextResponse.redirect(url);
      }

      const positionKey = `variantImagePosition_${variantId}`;
      const variantPosition = String(formData.get(positionKey) ?? "").trim();
      if (variantPosition) {
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { imagePosition: variantPosition },
        });
      }
    }

    const galleryEntries = Array.from(formData.entries()).filter(([key]) =>
      key.startsWith("variantGallery_"),
    );

    for (const [key, value] of galleryEntries) {
      if (!(value instanceof File) || value.size === 0) continue;
      const parts = key.replace("variantGallery_", "").split("_");
      const variantId = parts[0];
      const sortOrder = Number(parts[1] ?? "0");
      try {
        const buffer = Buffer.from(await value.arrayBuffer());
        const imageUrl = await saveCompressedProductImage(buffer);
        await prisma.productVariantImage.create({
          data: { variantId, imageUrl, sortOrder },
        });
      } catch (error) {
        const url = new URL(`/admin/productos/${id}`, req.url);
        url.searchParams.set(
          "error",
          error instanceof Error ? error.message : "No se pudo guardar una foto de galería.",
        );
        return NextResponse.redirect(url);
      }
    }

    const removeGalleryIds = formData.getAll("removeGalleryImage").map(String);
    if (removeGalleryIds.length > 0) {
      await prisma.productVariantImage.deleteMany({
        where: { id: { in: removeGalleryIds } },
      });
    }

    return NextResponse.redirect(new URL(`/admin/productos/${id}?ok=1`, req.url));
  }

  if (intent === "update_details") {
    const parsed = updateDetailsSchema.safeParse({
      name: formData.get("name"),
      sku: formData.get("sku"),
      supplierName: formData.get("supplierName"),
      description: formData.get("description"),
      categoryName: formData.get("categoryName"),
      listPrice: formData.get("listPrice"),
      wholesalePrice: formData.get("wholesalePrice"),
    });

    if (!parsed.success) {
      const url = new URL(`/admin/productos/${id}`, req.url);
      url.searchParams.set("error", "Revisá los datos y precios del producto.");
      return NextResponse.redirect(url);
    }

    const categorySlug = categorySlugFromName(parsed.data.categoryName);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: parsed.data.categoryName },
      create: { name: parsed.data.categoryName, slug: categorySlug },
    });

    await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name,
        sku: parsed.data.sku?.trim() || null,
        supplierName: parsed.data.supplierName?.trim() || null,
        description: parsed.data.description?.trim() ?? "",
        categoryId: category.id,
        listPrice: parsed.data.listPrice,
        wholesalePrice: parsed.data.wholesalePrice ?? parsed.data.listPrice,
        discountBadgeLabel: null,
      },
    });

    return NextResponse.redirect(new URL(`/admin/productos/${id}?ok=1`, req.url));
  }

  if (intent === "update_visibility") {
    const parsed = updateVisibilitySchema.safeParse({
      catalogVisibility: formData.get("catalogVisibility"),
    });
    if (!parsed.success) {
      return NextResponse.redirect(new URL("/admin/productos?error=Visibilidad+inválida", req.url));
    }
    await prisma.product.update({
      where: { id },
      data: { catalogVisibility: parsed.data.catalogVisibility },
    });
    return NextResponse.redirect(new URL("/admin/productos", req.url));
  }

  if (intent === "update_category") {
    const parsed = updateCategorySchema.safeParse({
      categoryName: formData.get("categoryName"),
    });

    if (!parsed.success) {
      const url = new URL(`/admin/productos/${id}`, req.url);
      url.searchParams.set("error", "Categoría inválida.");
      return NextResponse.redirect(url);
    }

    const categorySlug = categorySlugFromName(parsed.data.categoryName);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: parsed.data.categoryName },
      create: {
        name: parsed.data.categoryName,
        slug: categorySlug,
      },
    });

    await prisma.product.update({
      where: { id },
      data: { categoryId: category.id },
    });

    return NextResponse.redirect(new URL(`/admin/productos/${id}?ok=1`, req.url));
  }

  const payload = Object.fromEntries(formData.entries());
  const parsed = updateAvailabilitySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
  });

  return NextResponse.redirect(new URL("/admin/productos", req.url));
}
