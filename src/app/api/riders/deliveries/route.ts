import { NextResponse } from "next/server";
import { extractBearerToken, verifyRiderToken } from "@/lib/rider-auth";
import { listRiderDeliveries } from "@/lib/rider-deliveries";
import { isRidersAppEnabled, ridersAppDisabledResponse } from "@/lib/riders-feature";
import { prisma } from "@/lib/prisma";

async function requireActiveRider(req: Request) {
  const token = extractBearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "Token requerido." }, { status: 401 }) };
  }

  const payload = await verifyRiderToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 }) };
  }

  const rider = await prisma.rider.findUnique({
    where: { id: payload.sub },
    select: { id: true, isActive: true },
  });

  if (!rider?.isActive) {
    return { error: NextResponse.json({ error: "Cuenta inactiva." }, { status: 403 }) };
  }

  return { rider };
}

/** Entregas a domicilio emitidas y pendientes de confirmación con código. */
export async function GET(req: Request) {
  if (!(await isRidersAppEnabled())) {
    return ridersAppDisabledResponse();
  }

  const auth = await requireActiveRider(req);
  if ("error" in auth && auth.error) {
    return auth.error;
  }

  const deliveries = await listRiderDeliveries(auth.rider.id);
  return NextResponse.json({ deliveries });
}
