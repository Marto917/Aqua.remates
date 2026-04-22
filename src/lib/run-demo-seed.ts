import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { Prisma, UserRole } from "@prisma/client";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";

const bazarCategories = [
  { name: "Cocina", slug: "cocina" },
  { name: "Organización", slug: "organizacion" },
  { name: "Decoración", slug: "decoracion" },
  { name: "Baño", slug: "bano" },
  { name: "Limpieza del hogar", slug: "limpieza-del-hogar" },
];

/**
 * Datos demo: usuarios staff/cliente + categorías + 4 productos con variantes.
 * Idempotente (upsert). Usado por `npm run db:seed` y por POST /api/setup-demo.
 */
export async function runDemoSeed(prisma: PrismaClient): Promise<void> {
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
      imageUrl: DEFAULT_PRODUCT_IMAGE,
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
      imageUrl: DEFAULT_PRODUCT_IMAGE,
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
      imageUrl: DEFAULT_PRODUCT_IMAGE,
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
      imageUrl: DEFAULT_PRODUCT_IMAGE,
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

  const demoCustomer = await prisma.user.findUnique({
    where: { email: "cliente@aqua.local" },
  });
  const demoEmployee = await prisma.user.findUnique({
    where: { email: "empleado@aqua.local" },
  });
  const demoProduct = await prisma.product.findUnique({
    where: { slug: "botella-termica-pro" },
  });

  if (demoCustomer && demoEmployee && demoProduct) {
    const leadCount = await prisma.wholesaleLead.count();
    if (leadCount === 0) {
      await prisma.wholesaleLead.create({
        data: {
          companyName: "Mayorista Sur (lead)",
          contactName: "Lucía Gómez",
          email: "compras@mayoristasur.demo",
          phone: "+54 11 5555-0000",
          taxId: "30-71000000-1",
          estimatedVolume: "10-20 unidades / mes",
          message: "Hola, necesitamos cotización para revender en zona sur. Gracias.",
        },
      });
    }

    const existingWr = await prisma.wholesaleRequest.findFirst({
      where: { companyName: "Distribuidora Demo SA" },
    });

    if (!existingWr) {
      const variant = await prisma.productVariant.findFirst({
        where: { productId: demoProduct.id },
      });
      if (variant) {
        const qty = 24;
        const unit = Number(demoProduct.wholesalePrice);
        const sub = unit * qty;
        const wr = await prisma.wholesaleRequest.create({
          data: {
            customerId: demoCustomer.id,
            companyName: "Distribuidora Demo SA",
            cuit: "30-12345678-9",
            contactName: "Martín Paz",
            email: "compras@distribuidorademo.ar",
            phone: "+54 11 4321-0000",
            items: {
              create: [
                {
                  productId: demoProduct.id,
                  variantId: variant.id,
                  productNameSnapshot: demoProduct.name,
                  colorLabelSnapshot: variant.colorLabel,
                  unitPrice: new Prisma.Decimal(unit),
                  quantity: qty,
                  subtotal: new Prisma.Decimal(sub),
                },
              ],
            },
            events: {
              create: [{ userId: demoEmployee.id, action: "CREATED", payload: { source: "seed" } }],
            },
          },
        });

        await prisma.approvalRequest.create({
          data: {
            wholesaleRequestId: wr.id,
            requestedById: demoEmployee.id,
            type: "PRECIO_ESPECIAL",
            note: "Cliente pide 3% adicional por volumen (referencia demo).",
          },
        });
      }
    }
  }
}
