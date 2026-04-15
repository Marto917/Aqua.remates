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
    update: { emailVerified: verifiedAt },
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
    update: { emailVerified: verifiedAt },
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
    update: { emailVerified: verifiedAt },
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

  await prisma.product.upsert({
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
