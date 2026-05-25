import { NextResponse } from "next/server";
import { z } from "zod";
import { canStaffAccess, getStaffContext } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  fromCategoryId: z.string().min(1),
  toCategoryId: z.string().min(1),
  confirm: z.literal(true),
});

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Confirmá la migración y elegí categorías válidas." }, { status: 400 });
  }

  const { fromCategoryId, toCategoryId } = parsed.data;
  if (fromCategoryId === toCategoryId) {
    return NextResponse.json({ error: "Elegí una categoría destino distinta." }, { status: 400 });
  }

  const [fromCat, toCat] = await Promise.all([
    prisma.category.findUnique({ where: { id: fromCategoryId } }),
    prisma.category.findUnique({ where: { id: toCategoryId } }),
  ]);

  if (!fromCat || !toCat) {
    return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  }

  const result = await prisma.product.updateMany({
    where: { categoryId: fromCategoryId },
    data: { categoryId: toCategoryId },
  });

  return NextResponse.json({
    ok: true,
    moved: result.count,
    from: fromCat.name,
    to: toCat.name,
  });
}
