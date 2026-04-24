import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { categorySlugFromName, CATEGORY_NAMES, type CategoryName } from "@/lib/categories";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { saveCompressedProductImage } from "@/lib/save-product-image";
import { ensureUniqueProductSlug } from "@/lib/unique-product-slug";

export const runtime = "nodejs";

function parseNumericInput(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw) return undefined;

  let normalized = raw.replace(/\s+/g, "").replace(/\$/g, "");
  if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(",", ".");
  }
  normalized = normalized.replace(/[^0-9.-]/g, "");
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const positiveAmountSchema = z.preprocess(parseNumericInput, z.number().positive());
const discountPercentSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || typeof value === "undefined") return 0;
    return parseNumericInput(value);
  },
  z.number().int().min(0).max(100),
);

const categoryNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value): value is CategoryName => CATEGORY_NAMES.includes(value as CategoryName), {
    message: "Categoria invalida",
  });

const productSchema = z.object({
  name: z.string().trim().min(2),
  supplierName: z.string().trim().min(2, "El proveedor es obligatorio."),
  description: z.string().optional().transform((value) => value?.trim() ?? ""),
  categoryName: categoryNameSchema,
  listPrice: positiveAmountSchema,
  retailPrice: positiveAmountSchema,
  wholesalePrice: positiveAmountSchema,
  discountRetailPercent: discountPercentSchema.default(0),
  discountWholesalePercent: discountPercentSchema.default(0),
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

  const rawName = String(formData.get("name") ?? "").trim();
  const rawDescription = String(formData.get("description") ?? "").trim();
  const rawSupplierName = String(formData.get("supplierName") ?? "").trim();
  const rawCategory = String(formData.get("categoryName") ?? "")
    .trim()
    .toLowerCase();

  if (!rawName) {
    return errorResponse(req, 400, "Falta el nombre del producto.");
  }
  if (!rawSupplierName) {
    return errorResponse(req, 400, "El proveedor es obligatorio.");
  }

  const listPriceCandidate = parseNumericInput(formData.get("listPrice"));
  const retailPriceCandidate = parseNumericInput(formData.get("retailPrice"));
  const wholesalePriceCandidate = parseNumericInput(formData.get("wholesalePrice"));

  const normalizedData = parsed.success
    ? parsed.data
    : {
        name: rawName,
        supplierName: rawSupplierName,
        description: rawDescription,
        categoryName: CATEGORY_NAMES.includes(rawCategory as CategoryName)
          ? (rawCategory as CategoryName)
          : CATEGORY_NAMES[0],
        listPrice: listPriceCandidate && listPriceCandidate > 0 ? listPriceCandidate : 1,
        retailPrice:
          retailPriceCandidate && retailPriceCandidate > 0
            ? retailPriceCandidate
            : listPriceCandidate && listPriceCandidate > 0
              ? listPriceCandidate
              : 1,
        wholesalePrice:
          wholesalePriceCandidate && wholesalePriceCandidate > 0
            ? wholesalePriceCandidate
            : retailPriceCandidate && retailPriceCandidate > 0
              ? retailPriceCandidate
              : 1,
        discountRetailPercent: Math.max(0, Math.min(100, Math.round(parseNumericInput(formData.get("discountRetailPercent")) ?? 0))),
        discountWholesalePercent: Math.max(
          0,
          Math.min(100, Math.round(parseNumericInput(formData.get("discountWholesalePercent")) ?? 0)),
        ),
        isBestSeller: formData.get("isBestSeller") === "on",
        isActive: formData.get("isActive") === "on",
      };

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

  const categorySlug = categorySlugFromName(normalizedData.categoryName) || `categoria-${Date.now()}`;
  const colorRaw = String(formData.get("colorLabels") ?? "");
  const colorLabels = colorRaw
    .split(/[,;\n]/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^#([0-9A-F]{6})$/.test(s))
    .filter((s, index, arr) => arr.indexOf(s) === index)
    .filter(Boolean);
  const labels = colorLabels.length > 0 ? colorLabels : ["#64748b"];

  const productSlug = await ensureUniqueProductSlug(prisma, normalizedData.name);
  const product = await prisma.product.create({
    data: {
      name: normalizedData.name,
      supplierName: normalizedData.supplierName,
      slug: productSlug,
      description: normalizedData.description,
      imageUrl,
      listPrice: normalizedData.listPrice,
      retailPrice: normalizedData.retailPrice,
      wholesalePrice: normalizedData.wholesalePrice,
      discountRetailPercent: normalizedData.discountRetailPercent,
      discountWholesalePercent: normalizedData.discountWholesalePercent,
      isBestSeller: normalizedData.isBestSeller,
      isActive: normalizedData.isActive,
      category: {
        connectOrCreate: {
          where: { slug: categorySlug },
          create: {
            name: normalizedData.categoryName,
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
