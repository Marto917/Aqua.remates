import type { PrismaClient } from "@prisma/client";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";

const bazarCategories = [
  { name: "Cocina", slug: "cocina" },
  { name: "Organización", slug: "organizacion" },
  { name: "Decoración", slug: "decoracion" },
  { name: "Baño", slug: "bano" },
  { name: "Limpieza del hogar", slug: "limpieza-del-hogar" },
];

/**
 * Datos demo de catálogo: categorías + productos con variantes.
 * Idempotente (upsert). No crea usuarios ni credenciales.
 * Usado por `npm run db:seed` y por POST /api/setup-demo.
 */
export async function runDemoSeed(prisma: PrismaClient): Promise<void> {
  for (const c of bazarCategories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const category = await prisma.category.findUnique({ where: { slug: "cocina" } });
  if (!category) {
    throw new Error("Categoria cocina no encontrada");
  }

  const product = await prisma.product.upsert({
    where: { slug: "botella-termica-pro" },
    update: {
      discountWholesalePercent: 15,
    },
    create: {
      name: "Botella Termica Pro",
      slug: "botella-termica-pro",
      description: "Botella de acero premium para uso diario.",
      imageUrl: DEFAULT_PRODUCT_IMAGE,
      listPrice: 45000,
      wholesalePrice: 32000,
      discountWholesalePercent: 15,
      isActive: true,
      isBestSeller: true,
      categoryId: category.id,
    },
  });

  await prisma.productVariant.deleteMany({ where: { productId: product.id } });
  await prisma.productVariant.createMany({
    data: ["Azul", "Rosa", "Negro"].map((colorLabel, i) => ({
      productId: product.id,
      colorLabel,
      sortOrder: i,
    })),
  });

  const catOrg = await prisma.category.findUnique({ where: { slug: "organizacion" } });
  const catDeco = await prisma.category.findUnique({ where: { slug: "decoracion" } });
  const catBano = await prisma.category.findUnique({ where: { slug: "bano" } });
  if (!catOrg || !catDeco || !catBano) {
    throw new Error("Categorias demo incompletas");
  }

  const extraProducts = [
    {
      slug: "set-organizadores-apilables",
      name: "Set organizadores apilables",
      description: "Tres cajas para ordenar el placard o la cocina.",
      imageUrl: DEFAULT_PRODUCT_IMAGE,
      listPrice: 28900,
      wholesalePrice: 19800,
      categoryId: catOrg.id,
      colors: ["Gris", "Beige"],
    },
    {
      slug: "maceta-ceramica-nordica",
      name: "Maceta cerámica nórdica",
      description: "Ideal para plantas medianas en living o balcón.",
      imageUrl: DEFAULT_PRODUCT_IMAGE,
      listPrice: 15900,
      wholesalePrice: 9900,
      categoryId: catDeco.id,
      colors: ["Blanco", "Terracota"],
    },
    {
      slug: "toallero-acero-inox",
      name: "Toallero acero inoxidable",
      description: "Barra adhesiva o tornillos; acabado satinado.",
      imageUrl: DEFAULT_PRODUCT_IMAGE,
      listPrice: 22000,
      wholesalePrice: 15200,
      categoryId: catBano.id,
      colors: ["Cromo"],
    },
  ];

  for (const p of extraProducts) {
    const { colors, ...data } = p;
    const created = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        listPrice: data.listPrice,
        wholesalePrice: data.wholesalePrice,
        categoryId: data.categoryId,
        isActive: true,
        isBestSeller: true,
      },
      create: {
        ...data,
        discountWholesalePercent: 10,
        isActive: true,
        isBestSeller: true,
      },
    });
    await prisma.productVariant.deleteMany({ where: { productId: created.id } });
    await prisma.productVariant.createMany({
      data: colors.map((colorLabel, i) => ({
        productId: created.id,
        colorLabel,
        sortOrder: i,
      })),
    });
  }
}
