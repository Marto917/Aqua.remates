import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await req.formData();
  const avatar = formData.get("avatar");
  if (!(avatar instanceof File) || avatar.size === 0) {
    return NextResponse.json({ error: "Elegí una imagen (JPG, PNG o WebP)." }, { status: 400 });
  }
  if (avatar.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera 12 MB." }, { status: 400 });
  }
  if (!avatar.type.startsWith("image/")) {
    return NextResponse.json({ error: "Formato no admitido. Usá JPG, PNG o WebP." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await avatar.arrayBuffer());
    const imageUrl = await saveCompressedProductImage(buffer);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { imageUrl },
    });
    return NextResponse.json({ ok: true, imageUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo guardar la foto.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
