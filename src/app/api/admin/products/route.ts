import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";
import { slugify } from "@/lib/slugify";
import { ensureUniqueProductSlug } from "@/lib/unique-product-slug";

export const runtime = "nodejs";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  categoryName: z.string().min(2),
  listPrice: z.coerce.number().positive(),
  retailPrice: z.coerce.number().positive(),
  wholesalePrice: z.coerce.number().positive(),
  discountRetailPercent: z.coerce.number().int().min(0).max(100).default(0),
  discountWholesalePercent: z.coerce.number().int().min(0).max(100).default(0),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await getSafeSession();
  const canManage =
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE;
  if (!canManage) {
    const url = new URL("/admin/productos", req.url);
    url.searchParams.set(
      "error",
      "No autorizado. En el hosting definí BACKOFFICE_PREVIEW=true (o NEXT_PUBLIC_BACKOFFICE_PREVIEW=true) y redeploy, o iniciá sesión con un usuario staff.",
    );
    return NextResponse.redirect(url);
  }

  const formData = await req.formData();
  const payload = {
    ...Object.fromEntries(formData.entries()),
    isBestSeller: formData.get("isBestSeller") === "on",
    isActive: formData.get("isActive") === "on",
  };

  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    const url = new URL("/admin/productos", req.url);
    url.searchParams.set("error", "Datos invalidos.");
    return NextResponse.redirect(url);
  }

  const file = formData.get("imageFile");
  let imageUrl: string;
  if (file instanceof File && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await saveCompressedProductImage(buffer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo procesar la imagen.";
      const url = new URL("/admin/productos", req.url);
      url.searchParams.set("error", msg);
      return NextResponse.redirect(url);
    }
  } else {
    const url = new URL("/admin/productos", req.url);
    url.searchParams.set("error", "Subi una imagen del producto.");
    return NextResponse.redirect(url);
  }

  const categorySlug = slugify(parsed.data.categoryName) || `categoria-${Date.now()}`;

  const colorRaw = String(formData.get("colorLabels") ?? "");
  const colorLabels = colorRaw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const labels = colorLabels.length > 0 ? colorLabels : ["Único"];

  const productSlug = await ensureUniqueProductSlug(prisma, parsed.data.name);

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: productSlug,
      description: parsed.data.description,
      imageUrl,
      listPrice: parsed.data.listPrice,
      retailPrice: parsed.data.retailPrice,
      wholesalePrice: parsed.data.wholesalePrice,
      discountRetailPercent: parsed.data.discountRetailPercent,
      discountWholesalePercent: parsed.data.discountWholesalePercent,
      isBestSeller: parsed.data.isBestSeller,
      isActive: parsed.data.isActive,
      category: {
        connectOrCreate: {
          where: { slug: categorySlug },
          create: {
            name: parsed.data.categoryName,
            slug: categorySlug,
          },
        },
      },
    },
  });

  await prisma.productVariant.createMany({
    data: labels.map((colorLabel, i) => ({
      productId: product.id,
      colorLabel,
      sortOrder: i,
    })),
  });

  return NextResponse.redirect(new URL("/admin/productos", req.url));
}
