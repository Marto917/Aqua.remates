import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";

export const runtime = "nodejs";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const session = await getSafeSession();
  const canManage =
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE;
  if (!canManage) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

  const categorySlug = slugify(parsed.data.categoryName);

  const colorRaw = String(formData.get("colorLabels") ?? "");
  const colorLabels = colorRaw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const labels = colorLabels.length > 0 ? colorLabels : ["Único"];

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.slug),
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
