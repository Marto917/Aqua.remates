import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const bazarCategories = [
  { name: "Cocina", slug: "cocina" },
  { name: "Organización", slug: "organizacion" },
  { name: "Decoración", slug: "decoracion" },
  { name: "Baño", slug: "bano" },
  { name: "Limpieza del hogar", slug: "limpieza-del-hogar" },
];

async function main() {
  const ownerPassword = await bcrypt.hash("Owner1234", 10);
  const employeePassword = await bcrypt.hash("Empleado1234", 10);

  const verifiedAt = new Date();

  await prisma.user.upsert({
    where: { email: "owner@aqua.local" },
    update: {
      emailVerified: verifiedAt,
      passwordHash: ownerPassword,
    },
    create: {
      name: "Duenio Aqua",
      email: "owner@aqua.local",
      passwordHash: ownerPassword,
      role: UserRole.OWNER,
      emailVerified: verifiedAt,
    },
  });

  await prisma.user.upsert({
    where: { email: "empleado@aqua.local" },
    update: {
      emailVerified: verifiedAt,
      passwordHash: employeePassword,
    },
    create: {
      name: "Empleado Aqua",
      email: "empleado@aqua.local",
      passwordHash: employeePassword,
      role: UserRole.EMPLOYEE,
      emailVerified: verifiedAt,
    },
  });

  const customerPassword = await bcrypt.hash("Cliente1234", 10);
  await prisma.user.upsert({
    where: { email: "cliente@aqua.local" },
    update: {
      emailVerified: verifiedAt,
      passwordHash: customerPassword,
    },
    create: {
      name: "Cliente demo",
      email: "cliente@aqua.local",
      passwordHash: customerPassword,
      role: UserRole.CUSTOMER,
      emailVerified: verifiedAt,
    },
  });

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
      discountRetailPercent: 10,
      discountWholesalePercent: 15,
    },
    create: {
      name: "Botella Termica Pro",
      slug: "botella-termica-pro",
      description: "Botella de acero premium para uso diario.",
      imageUrl:
        "https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=1200&q=80",
      listPrice: 45000,
      retailPrice: 39000,
      wholesalePrice: 32000,
      discountRetailPercent: 10,
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
      imageUrl:
        "https://images.unsplash.com/photo-1584622650111-993a426c6a78?auto=format&fit=crop&w=1200&q=80",
      listPrice: 28900,
      retailPrice: 24900,
      wholesalePrice: 19800,
      categoryId: catOrg.id,
      colors: ["Gris", "Beige"],
    },
    {
      slug: "maceta-ceramica-nordica",
      name: "Maceta cerámica nórdica",
      description: "Ideal para plantas medianas en living o balcón.",
      imageUrl:
        "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=80",
      listPrice: 15900,
      retailPrice: 12900,
      wholesalePrice: 9900,
      categoryId: catDeco.id,
      colors: ["Blanco", "Terracota"],
    },
    {
      slug: "toallero-acero-inox",
      name: "Toallero acero inoxidable",
      description: "Barra adhesiva o tornillos; acabado satinado.",
      imageUrl:
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80",
      listPrice: 22000,
      retailPrice: 18900,
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
        retailPrice: data.retailPrice,
        wholesalePrice: data.wholesalePrice,
        categoryId: data.categoryId,
        isActive: true,
        isBestSeller: true,
      },
      create: {
        ...data,
        discountRetailPercent: 5,
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

  console.log("Seed ejecutado correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
