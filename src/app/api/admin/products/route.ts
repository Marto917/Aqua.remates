import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { appPathUrl, redirectToApp } from "@/lib/app-url";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { categorySlugFromName } from "@/lib/categories";
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
const categoryNameSchema = z.string().trim().min(2).max(40);

const productSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().max(64).optional(),
  supplierName: z.string().trim().min(2, "El proveedor es obligatorio."),
  description: z.string().optional().transform((value) => value?.trim() ?? ""),
  categoryName: categoryNameSchema,
  listPrice: positiveAmountSchema,
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
  const url = appPathUrl("/admin/productos", req);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
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

  const listCandidate = parseNumericInput(formData.get("listPrice"));

  const normalizedData = parsed.success
    ? parsed.data
    : {
        name: rawName,
        sku: String(formData.get("sku") ?? "").trim() || undefined,
        supplierName: rawSupplierName,
        description: rawDescription,
        categoryName: rawCategory || "bazar",
        listPrice: listCandidate && listCandidate > 0 ? listCandidate : 1,
        isBestSeller: formData.get("isBestSeller") === "on",
        isActive: formData.get("isActive") === "on",
      };

  const listPrice = normalizedData.listPrice;

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
      sku: normalizedData.sku || null,
      supplierName: normalizedData.supplierName,
      slug: productSlug,
      description: normalizedData.description,
      imageUrl,
      listPrice,
      wholesalePrice: listPrice,
      discountWholesalePercent: 0,
      discountBadgeLabel: null,
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

  return redirectToApp("/admin/productos?ok=1", req);
}
