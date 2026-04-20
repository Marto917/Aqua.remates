import { existsSync, readdirSync } from "fs";
import path from "path";
import archiver from "archiver";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import type { CatalogExportV1 } from "@/lib/catalog-export-schema";
import { CATALOG_EXPORT_VERSION } from "@/lib/catalog-export-schema";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const LEEME = `Exportación de catálogo AQUA
============================

Contenido del ZIP:
- catalog-aqua.json  → datos de productos, categorías y variantes
- public/uploads/    → imágenes (WebP) referenciadas en la tienda

Cómo usarlo en el proyecto final
---------------------------------
1) Descomprimí el ZIP.
2) Copiá la carpeta "public" dentro de la raíz del repo Aqua (fusioná con la que ya existe).
   Así las rutas /uploads/products/... del JSON coinciden con los archivos.

3) Base de datos:
   - Si seguís usando la MISMA base (mismo DATABASE_URL): con copiar "public" suele alcanzar
     para que las imágenes se vean tras un deploy.
   - Si es una base NUEVA o vacía, importá el JSON ejecutando en la raíz del proyecto:

     npm run import:catalog -- ruta/al/catalog-aqua.json

     (o la carpeta donde está el JSON: npm run import:catalog -- ./carpeta/exportada)

`;

function buildCatalogJson(): Promise<CatalogExportV1> {
  return (async () => {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const categoryMap = new Map<string, { name: string; slug: string }>();
    for (const p of products) {
      if (!categoryMap.has(p.category.slug)) {
        categoryMap.set(p.category.slug, {
          name: p.category.name,
          slug: p.category.slug,
        });
      }
    }

    return {
      version: CATALOG_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      categories: [...categoryMap.values()],
      products: products.map((p) => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        listPrice: String(p.listPrice),
        retailPrice: String(p.retailPrice),
        wholesalePrice: String(p.wholesalePrice),
        discountRetailPercent: p.discountRetailPercent,
        discountWholesalePercent: p.discountWholesalePercent,
        isActive: p.isActive,
        isBestSeller: p.isBestSeller,
        categorySlug: p.category.slug,
        variants: p.variants.map((v) => ({
          colorLabel: v.colorLabel,
          imageUrl: v.imageUrl,
          sortOrder: v.sortOrder,
          isActive: v.isActive,
        })),
      })),
    };
  })();
}

export async function GET() {
  const session = await getSafeSession();
  const allowed =
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE;

  if (!allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const catalog = await buildCatalogJson();

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (c: Buffer) => chunks.push(c));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    archive.append(JSON.stringify(catalog, null, 2), { name: "catalog-aqua.json" });
    archive.append(LEEME, { name: "LEEME.txt" });

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
    if (existsSync(uploadsDir)) {
      for (const name of readdirSync(uploadsDir)) {
        const full = path.join(uploadsDir, name);
        const zipPath = `public/uploads/products/${name}`;
        archive.file(full, { name: zipPath });
      }
    }

    void archive.finalize();
  });

  const filename = `aqua-catalogo-${new Date().toISOString().slice(0, 10)}.zip`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
