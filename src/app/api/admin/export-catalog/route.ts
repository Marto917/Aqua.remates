import { createHash } from "crypto";
import { existsSync, readdirSync, statSync } from "fs";
import { PassThrough } from "stream";
import { Readable } from "stream";
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
/** Catálogos grandes + imágenes: Railway puede cortar antes si es bajo. */
export const maxDuration = 300;

const MAX_REMOTE_IMAGES = 80;
const REMOTE_FETCH_TIMEOUT_MS = 8_000;
const REMOTE_CONCURRENCY = 3;

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
  const timer = setTimeout(() => ctrl.abort(), REMOTE_FETCH_TIMEOUT_MS);
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

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
) {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
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

function collectRemoteUrls(catalog: CatalogExportV2): string[] {
  const remoteUrls = new Set<string>();
  for (const p of catalog.products) {
    if (p.imageUrl?.startsWith("http")) remoteUrls.add(p.imageUrl);
    for (const v of p.variants) {
      if (v.imageUrl?.startsWith("http")) remoteUrls.add(v.imageUrl);
    }
  }
  return [...remoteUrls].slice(0, MAX_REMOTE_IMAGES);
}

/**
 * Arma el ZIP en streaming (sin bufferizar todo en RAM) para que el navegador
 * empiece a recibir bytes y pueda mostrar progreso.
 */
function startZipStream(catalog: CatalogExportV2): ReadableStream<Uint8Array> {
  const passThrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 5 } });

  archive.on("error", (err) => {
    console.error("[export-catalog] archiver", err);
    passThrough.destroy(err);
  });
  archive.pipe(passThrough);

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

      const remotes = collectRemoteUrls(catalog);
      await mapPool(remotes, REMOTE_CONCURRENCY, async (url) => {
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
      });

      await archive.finalize();
    } catch (e) {
      console.error("[export-catalog] build zip", e);
      archive.abort();
      passThrough.destroy(e instanceof Error ? e : new Error(String(e)));
    }
  })();

  return Readable.toWeb(passThrough) as ReadableStream<Uint8Array>;
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
    const filename = `aqua-catalogo-${new Date().toISOString().slice(0, 10)}.zip`;
    const stream = startZipStream(catalog);

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Aqua-Export-Products": String(catalog.products.length),
        // Sin Content-Length: el ZIP se genera al vuelo.
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
