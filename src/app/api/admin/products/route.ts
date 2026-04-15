import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  imageUrl: z.string().url(),
  categoryName: z.string().min(2),
  listPrice: z.coerce.number().positive(),
  retailPrice: z.coerce.number().positive(),
  wholesalePrice: z.coerce.number().positive(),
  discountPercent: z.coerce.number().int().min(0).max(100).default(0),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || ![UserRole.OWNER, UserRole.EMPLOYEE].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const payload = {
    ...Object.fromEntries(formData.entries()),
    isBestSeller: formData.get("isBestSeller") === "on",
    isActive: formData.get("isActive") === "on",
  };

  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const categorySlug = slugify(parsed.data.categoryName);
  await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.slug),
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      listPrice: parsed.data.listPrice,
      retailPrice: parsed.data.retailPrice,
      wholesalePrice: parsed.data.wholesalePrice,
      discountPercent: parsed.data.discountPercent,
      isBestSeller: parsed.data.isBestSeller,
      isActive: parsed.data.isActive,
      category: {
        connectOrCreate: {
          where: { slug: categorySlug },
          create: {
            name: parsed.data.categoryName,
            slug: categorySlug,
          },
        },
      },
    },
  });

  return NextResponse.redirect(new URL("/admin/productos", req.url));
}
