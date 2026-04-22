import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { categorySlugFromName, CATEGORY_NAMES } from "@/lib/categories";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { saveCompressedProductImage } from "@/lib/save-product-image";
import { ensureUniqueProductSlug } from "@/lib/unique-product-slug";

export const runtime = "nodejs";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  categoryName: z.enum(CATEGORY_NAMES),
  listPrice: z.coerce.number().positive(),
  retailPrice: z.coerce.number().positive(),
  wholesalePrice: z.coerce.number().positive(),
  discountRetailPercent: z.coerce.number().int().min(0).max(100).default(0),
  discountWholesalePercent: z.coerce.number().int().min(0).max(100).default(0),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

function wantsJson(req: Request): boolean {
  const accept = req.headers.get("accept")?.toLowerCase() ?? "";
  const requestedWith = req.headers.get("x-requested-with")?.toLowerCase() ?? "";
  return requestedWith === "xmlhttprequest" || accept.includes("application/json");
}

function errorResponse(req: Request, status: number, message: string) {
  if (wantsJson(req)) {
    return NextResponse.json({ error: message }, { status });
  }
  const url = new URL("/admin/productos", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(req: Request) {
  const session = await getSafeSession();
  const canManage =
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE;
  if (!canManage) {
    return errorResponse(
      req,
      401,
      "No autorizado. En el hosting defini BACKOFFICE_PREVIEW=true (o NEXT_PUBLIC_BACKOFFICE_PREVIEW=true) y redeploy, o inicia sesion con un usuario staff.",
    );
  }

  const formData = await req.formData();
  const payload = {
    ...Object.fromEntries(formData.entries()),
    isBestSeller: formData.get("isBestSeller") === "on",
    isActive: formData.get("isActive") === "on",
  };

  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(req, 400, "Datos invalidos. Revisa nombre, descripcion y precios.");
  }

  const file = formData.get("imageFile");
  let imageUrl = DEFAULT_PRODUCT_IMAGE;
  if (file instanceof File && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await saveCompressedProductImage(buffer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo procesar la imagen.";
      return errorResponse(req, 400, msg);
    }
  }

  const categorySlug = categorySlugFromName(parsed.data.categoryName) || `categoria-${Date.now()}`;
  const colorRaw = String(formData.get("colorLabels") ?? "");
  const colorLabels = colorRaw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const labels = colorLabels.length > 0 ? colorLabels : ["#64748b"];

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

  for (const [index, colorLabel] of labels.entries()) {
    const variantImageFile = formData.get(`variantImage_${index}`);
    let variantImageUrl: string | null = null;

    if (variantImageFile instanceof File && variantImageFile.size > 0) {
      try {
        const buffer = Buffer.from(await variantImageFile.arrayBuffer());
        variantImageUrl = await saveCompressedProductImage(buffer);
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : `No se pudo procesar la imagen de la variante ${colorLabel}.`;
        return errorResponse(req, 400, msg);
      }
    }

    await prisma.productVariant.create({
      data: {
        productId: product.id,
        colorLabel,
        sortOrder: index,
        imageUrl: variantImageUrl,
      },
    });
  }

  if (wantsJson(req)) {
    return NextResponse.json({ ok: true, productId: product.id, slug: product.slug });
  }

  return NextResponse.redirect(new URL("/admin/productos?ok=1", req.url));
}
