import { CatalogVisibility, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { appPathUrl, redirectToApp } from "@/lib/app-url";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { categorySlugFromName } from "@/lib/categories";
import { getSafeSession } from "@/lib/get-session";
import { barcodesFromFormData } from "@/lib/product-barcodes";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { replaceProductBarcodes } from "@/lib/replace-product-barcodes";
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

function redirectWithError(req: Request, id: string, message: string) {
  const url = appPathUrl(`/admin/productos/${id}`, req);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handleProductPost(req, params);
  } catch (error) {
    console.error("[admin/products/:id] POST failed:", error);
    const { id } = await params.catch(() => ({ id: "" }));
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (id && code === "P2002") {
      return redirectWithError(
        req,
        id,
        "Ese código de barras / SKU ya está usado en otro producto.",
      );
    }
    if (id) {
      return redirectWithError(
        req,
        id,
        error instanceof Error ? error.message : "No se pudo guardar el producto.",
      );
    }
    return NextResponse.json({ error: "No se pudo guardar el producto." }, { status: 500 });
  }
}

async function handleProductPost(req: Request, params: Promise<{ id: string }>) {
  const session = await getSafeSession();
  const canManage =
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE;
  if (!canManage) {
    const url = appPathUrl("/admin/productos", req);
    url.searchParams.set(
      "error",
      "No autorizado. Configura BACKOFFICE_PREVIEW en el hosting o inicia sesion como staff.",
    );
    return Response.redirect(url, 303);
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
        return redirectWithError(
          req,
          id,
          error instanceof Error ? error.message : "No se pudo procesar la imagen del producto.",
        );
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
        return redirectWithError(
          req,
          id,
          error instanceof Error ? error.message : "No se pudo procesar una imagen de variante.",
        );
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

    const galleryByVariant = new Map<string, File[]>();
    for (const [key, value] of galleryEntries) {
      if (!(value instanceof File) || value.size === 0) continue;
      const rest = key.replace("variantGallery_", "");
      const lastUnderscore = rest.lastIndexOf("_");
      const variantId = lastUnderscore >= 0 ? rest.slice(0, lastUnderscore) : rest;
      if (!variantId) continue;
      const list = galleryByVariant.get(variantId) ?? [];
      list.push(value);
      galleryByVariant.set(variantId, list);
    }

    const removeGalleryIds = formData.getAll("removeGalleryImage").map(String);
    if (removeGalleryIds.length > 0) {
      await prisma.productVariantImage.deleteMany({
        where: { id: { in: removeGalleryIds } },
      });
    }

    const MAX_GALLERY = 8;
    for (const [variantId, files] of galleryByVariant) {
      const currentCount = await prisma.productVariantImage.count({ where: { variantId } });
      const room = Math.max(0, MAX_GALLERY - currentCount);
      const toSave = files.slice(0, room);
      let sortOrder = currentCount;
      for (const file of toSave) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const imageUrl = await saveCompressedProductImage(buffer);
          await prisma.productVariantImage.create({
            data: { variantId, imageUrl, sortOrder },
          });
          sortOrder += 1;
        } catch (error) {
          return redirectWithError(
            req,
            id,
            error instanceof Error ? error.message : "No se pudo guardar una foto de galería.",
          );
        }
      }
    }

    return redirectToApp(`/admin/productos/${id}?ok=1`, req);
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
      return redirectWithError(req, id, "Revisá los datos y precios del producto.");
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
        supplierName: parsed.data.supplierName?.trim() || null,
        description: parsed.data.description?.trim() ?? "",
        categoryId: category.id,
        listPrice: parsed.data.listPrice,
        wholesalePrice: parsed.data.wholesalePrice ?? parsed.data.listPrice,
        discountBadgeLabel: null,
      },
    });

    try {
      await replaceProductBarcodes(id, barcodesFromFormData(formData));
    } catch (error) {
      return redirectWithError(
        req,
        id,
        error instanceof Error ? error.message : "No se pudieron guardar los códigos de barra.",
      );
    }

    return redirectToApp(`/admin/productos/${id}?ok=1`, req);
  }

  if (intent === "update_visibility") {
    const parsed = updateVisibilitySchema.safeParse({
      catalogVisibility: formData.get("catalogVisibility"),
    });
    if (!parsed.success) {
      return redirectToApp("/admin/productos?error=Visibilidad+inválida", req);
    }
    await prisma.product.update({
      where: { id },
      data: { catalogVisibility: parsed.data.catalogVisibility },
    });
    return redirectToApp("/admin/productos", req);
  }

  if (intent === "update_category") {
    const parsed = updateCategorySchema.safeParse({
      categoryName: formData.get("categoryName"),
    });

    if (!parsed.success) {
      return redirectWithError(req, id, "Categoría inválida.");
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

    return redirectToApp(`/admin/productos/${id}?ok=1`, req);
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

  return redirectToApp("/admin/productos", req);
}
