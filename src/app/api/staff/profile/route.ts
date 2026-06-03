import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getStaffContext, canStaffAccess } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const userId = ctx.session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  const role = ctx.session?.user?.role;
  if (role !== UserRole.OWNER && role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "Solo staff." }, { status: 403 });
  }

  const formData = await req.formData();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Nombre demasiado corto." }, { status: 400 });
  }

  let imageUrl: string | undefined;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    try {
      const buffer = Buffer.from(await avatar.arrayBuffer());
      imageUrl = await saveCompressedProductImage(buffer);
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      ...(imageUrl ? { imageUrl } : {}),
    },
    select: { name: true, imageUrl: true },
  });

  return NextResponse.json({ ok: true, name: updated.name, imageUrl: updated.imageUrl });
}
