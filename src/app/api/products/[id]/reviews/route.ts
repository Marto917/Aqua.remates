import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
  authorName: z.string().trim().min(1).max(80).optional(),
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

  const session = await getSafeSession();
  const authorName =
    session?.user?.name?.trim() ||
    parsed.data.authorName ||
    session?.user?.email?.split("@")[0];

  if (!authorName) {
    return NextResponse.json({ error: "Indicá tu nombre para publicar." }, { status: 400 });
  }

  const review = await prisma.productReview.create({
    data: {
      productId,
      userId: session?.user?.id ?? null,
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
