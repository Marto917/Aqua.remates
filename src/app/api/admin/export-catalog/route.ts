import { createHash } from "crypto";
import { existsSync, readdirSync, statSync } from "fs";
import path from "path";
import archiver from "archiver";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import type { CatalogExportV2 } from "@/lib/catalog-export-schema";
import { CATALOG_EXPORT_VERSION } from "@/lib/catalog-export-schema";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { getProductUploadsDir } from "@/lib/uploads-paths";

export const runtime = "nodejs";
/** Evita que Railway/proxy corte el request si hay muchas imágenes. */
export const maxDuration = 120;

const LEEME = `Exportación de catálogo AQUA
============================

Contenido del ZIP:
- catalog-aqua.json  → datos de productos, categorías y variantes
- public/uploads/    → imágenes (WebP) usadas por la tienda
  (si alguna imagen vive en un CDN, en el ZIP se descarga y se empaqueta en public/uploads/...)

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

function hashUrl(url: string) {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

async function fetchUrlBytes(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, { method: "GET", signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`No se pudo descargar ${url} (HTTP ${res.status})`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 25 * 1024 * 1024) {
      throw new Error("Imagen demasiado grande para empaquetar (25 MB).");
    }
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

async function buildCatalogJson(): Promise<CatalogExportV2> {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
      barcodes: { orderBy: { sortOrder: "asc" }, select: { code: true, label: true } },
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
      wholesalePrice: String(p.wholesalePrice),
      discountWholesalePercent: p.discountWholesalePercent,
      isActive: p.isActive,
      isBestSeller: p.isBestSeller,
      categorySlug: p.category.slug,
      sku: p.sku,
      barcodes: p.barcodes.map((b) => ({ code: b.code, label: b.label })),
      variants: p.variants.map((v) => ({
        colorLabel: v.colorLabel,
        imageUrl: v.imageUrl,
        sortOrder: v.sortOrder,
        isActive: v.isActive,
      })),
    })),
  };
}

function zipCatalog(catalog: CatalogExportV2): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    let settled = false;

    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    archive.on("data", (c: Buffer) => chunks.push(c));
    archive.on("error", fail);
    archive.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });

    void (async () => {
      try {
        archive.append(JSON.stringify(catalog, null, 2), { name: "catalog-aqua.json" });
        archive.append(LEEME, { name: "LEEME.txt" });

        const uploadsDir = getProductUploadsDir();
        if (existsSync(uploadsDir)) {
          for (const name of readdirSync(uploadsDir)) {
            const full = path.join(uploadsDir, name);
            try {
              if (!statSync(full).isFile()) continue;
            } catch {
              continue;
            }
            archive.file(full, { name: `public/uploads/products/${name}` });
          }
        }

        const remoteUrls = new Set<string>();
        for (const p of catalog.products) {
          if (p.imageUrl?.startsWith("http")) remoteUrls.add(p.imageUrl);
          for (const v of p.variants) {
            if (v.imageUrl?.startsWith("http")) remoteUrls.add(v.imageUrl);
          }
        }

        // No tumbar toda la exportación si una URL remota falla.
        for (const url of remoteUrls) {
          try {
            const bytes = await fetchUrlBytes(url);
            const ext = url.toLowerCase().includes(".png")
              ? "png"
              : url.toLowerCase().includes(".jpg") || url.toLowerCase().includes(".jpeg")
                ? "jpg"
                : "webp";
            archive.append(bytes, {
              name: `public/uploads/products/remote/${hashUrl(url)}.${ext}`,
            });
          } catch (e) {
            console.warn("[export-catalog] skip remote image:", url, e);
          }
        }

        await archive.finalize();
      } catch (e) {
        fail(e);
      }
    })();
  });
}

export async function GET() {
  try {
    const session = await getSafeSession();
    const allowed =
      isBackofficePreview() ||
      session?.user.role === UserRole.OWNER ||
      session?.user.role === UserRole.EMPLOYEE;

    if (!allowed) {
      return NextResponse.json({ error: "No autorizado. Volvé a iniciar sesión." }, { status: 401 });
    }

    const catalog = await buildCatalogJson();
    const buffer = await zipCatalog(catalog);
    const filename = `aqua-catalogo-${new Date().toISOString().slice(0, 10)}.zip`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    console.error("[export-catalog]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No se pudo generar el ZIP del catálogo. Reintentá en unos minutos.",
      },
      { status: 500 },
    );
  }
}
