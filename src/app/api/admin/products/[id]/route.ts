import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { categorySlugFromName, CATEGORY_NAMES } from "@/lib/categories";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { saveCompressedProductImage } from "@/lib/save-product-image";

const updateAvailabilitySchema = z.object({
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});
const updateCategorySchema = z.object({
  categoryName: z.enum(CATEGORY_NAMES),
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

    if (productImageUrl) {
      await prisma.product.update({
        where: { id },
        data: { imageUrl: productImageUrl },
      });
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
    }

    return NextResponse.redirect(new URL(`/admin/productos/${id}?ok=1`, req.url));
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
