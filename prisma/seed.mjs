import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = await bcrypt.hash("Owner1234", 10);
  const employeePassword = await bcrypt.hash("Empleado1234", 10);

  await prisma.user.upsert({
    where: { email: "owner@aqua.local" },
    update: {},
    create: {
      name: "Duenio Aqua",
      email: "owner@aqua.local",
      passwordHash: ownerPassword,
      role: UserRole.OWNER,
    },
  });

  await prisma.user.upsert({
    where: { email: "empleado@aqua.local" },
    update: {},
    create: {
      name: "Empleado Aqua",
      email: "empleado@aqua.local",
      passwordHash: employeePassword,
      role: UserRole.EMPLOYEE,
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: "hidratacion" },
    update: {},
    create: {
      name: "Hidratacion",
      slug: "hidratacion",
    },
  });

  await prisma.product.upsert({
    where: { slug: "botella-termica-pro" },
    update: {},
    create: {
      name: "Botella Termica Pro",
      slug: "botella-termica-pro",
      description: "Botella de acero premium para uso diario.",
      imageUrl:
        "https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=1200&q=80",
      listPrice: 45000,
      retailPrice: 39000,
      wholesalePrice: 32000,
      discountPercent: 10,
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
