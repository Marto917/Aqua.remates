/**
 * Importa `catalog-aqua.json` (mismo formato que el ZIP de exportación).
 *
 * Uso:
 *   npm run import:catalog -- ./ruta/catalog-aqua.json
 *   npm run import:catalog -- ./carpeta-descomprimida   (busca catalog-aqua.json adentro)
 *
 * Antes: copiá la carpeta `public` del ZIP en la raíz del proyecto para que existan las imágenes.
 */

import { existsSync, readFileSync, statSync } from "fs";
import path from "path";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const variantSchema = z.object({
  colorLabel: z.string().min(1),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

const productBaseSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  imageUrl: z.string().min(1),
  listPrice: z.string(),
  wholesalePrice: z.string(),
  discountWholesalePercent: z.number().int(),
  isActive: z.boolean(),
  isBestSeller: z.boolean(),
  categorySlug: z.string(),
  variants: z.array(variantSchema),
});

const catalogV2Schema = z.object({
  version: z.literal(2),
  exportedAt: z.string().optional(),
  categories: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
    }),
  ),
  products: z.array(productBaseSchema),
});

const catalogV1Schema = z.object({
  version: z.literal(1),
  exportedAt: z.string().optional(),
  categories: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
    }),
  ),
  products: z.array(
    productBaseSchema.extend({
      retailPrice: z.string().optional(),
      discountRetailPercent: z.number().int().optional(),
    }),
  ),
});

function resolveJsonPath(arg: string | undefined): string {
  if (!arg) {
    return path.join(process.cwd(), "catalog-aqua.json");
  }
  const abs = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
  if (existsSync(abs) && abs.endsWith(".json")) {
    return abs;
  }
  if (existsSync(abs)) {
    const st = statSync(abs);
    if (st.isDirectory()) {
      const inside = path.join(abs, "catalog-aqua.json");
      if (existsSync(inside)) return inside;
    }
  }
  throw new Error(`No se encontró catalog-aqua.json (argumento: ${arg ?? "vacío"})`);
}

function parseCatalog(raw: unknown) {
  const version = (raw as { version?: number })?.version;
  if (version === 2) return catalogV2Schema.parse(raw);
  if (version === 1) return catalogV1Schema.parse(raw);
  throw new Error("Versión de catálogo no soportada (use version 1 o 2).");
}

async function main() {
  const arg = process.argv[2];
  const jsonPath = resolveJsonPath(arg);
  const raw = readFileSync(jsonPath, "utf8");
  const data = parseCatalog(JSON.parse(raw));

  for (const c of data.categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
  }

  for (const p of data.products) {
    const category = await prisma.category.findUnique({
      where: { slug: p.categorySlug },
    });
    if (!category) {
      throw new Error(`Categoría no encontrada: ${p.categorySlug}`);
    }

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        listPrice: new Prisma.Decimal(p.listPrice),
        wholesalePrice: new Prisma.Decimal(p.wholesalePrice),
        discountWholesalePercent: p.discountWholesalePercent,
        isActive: p.isActive,
        isBestSeller: p.isBestSeller,
        categoryId: category.id,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        imageUrl: p.imageUrl,
        listPrice: new Prisma.Decimal(p.listPrice),
        wholesalePrice: new Prisma.Decimal(p.wholesalePrice),
        discountWholesalePercent: p.discountWholesalePercent,
        isActive: p.isActive,
        isBestSeller: p.isBestSeller,
        categoryId: category.id,
      },
    });

    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    if (p.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: p.variants.map((v) => ({
          productId: product.id,
          colorLabel: v.colorLabel,
          imageUrl: v.imageUrl,
          sortOrder: v.sortOrder,
          isActive: v.isActive,
        })),
      });
    }
  }

  console.log(`Import OK: ${data.products.length} productos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
