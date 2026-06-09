import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRidersAppEnabled, ridersAppDisabledResponse } from "@/lib/riders-feature";
import { extractBearerToken, verifyRiderToken } from "@/lib/rider-auth";

/** Perfil del rider autenticado (solo tabla Rider). */
export async function GET(req: Request) {
  if (!(await isRidersAppEnabled())) {
    return ridersAppDisabledResponse();
  }

  const token = extractBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Token requerido." }, { status: 401 });
  }

  const payload = await verifyRiderToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
  }

  const rider = await prisma.rider.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });

  if (!rider || !rider.isActive) {
    return NextResponse.json({ error: "Cuenta inactiva." }, { status: 403 });
  }

  return NextResponse.json({ rider });
}
