import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { canCustomerReview } from "@/lib/review-eligibility";

const bodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const session = await getSafeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tenés que iniciar sesión para opinar." }, { status: 401 });
  }
  if (session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ error: "Solo los clientes pueden dejar opiniones." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { createdAt: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 401 });
  }
  if (!canCustomerReview(user.createdAt)) {
    return NextResponse.json(
      { error: "Tu cuenta debe tener al menos 7 días para publicar una opinión." },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Completá valoración y comentario." }, { status: 400 });
  }

  const authorName = session.user.name?.trim() || user.name.trim();
  if (!authorName) {
    return NextResponse.json({ error: "Actualizá tu nombre en el perfil." }, { status: 400 });
  }

  const review = await prisma.productReview.create({
    data: {
      productId,
      userId: session.user.id,
      authorName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  return NextResponse.json({
    review: {
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    },
  });
}
