import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ productIds: [] });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });

  return NextResponse.json({ productIds: items.map((i) => i.productId) });
}

const postSchema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ error: "Iniciá sesión para usar favoritos." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId, isActive: true },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId: session.user.id, productId: parsed.data.productId },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ active: false });
  }

  await prisma.wishlistItem.create({
    data: { userId: session.user.id, productId: parsed.data.productId },
  });

  return NextResponse.json({ active: true });
}
