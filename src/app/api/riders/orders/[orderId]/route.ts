import { NextResponse } from "next/server";
import { z } from "zod";
import { extractBearerToken, verifyRiderToken } from "@/lib/rider-auth";
import { getRiderOrderAccess } from "@/lib/rider-order-access";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  riderNumber: z.coerce.number().int().positive().optional(),
});

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
    select: { id: true, riderNumber: true, isActive: true },
  });

  if (!rider?.isActive) {
    return { error: NextResponse.json({ error: "Cuenta inactiva." }, { status: 403 }) };
  }

  return { rider };
}

/**
 * Consulta un pedido tras escanear el QR. Solo el repartidor asignado puede verlo.
 * Query opcional: ?riderNumber=3 (debe coincidir con el del QR y con la asignación).
 */
export async function GET(req: Request, context: { params: Promise<{ orderId: string }> }) {
  const auth = await requireActiveRider(req);
  if ("error" in auth && auth.error) {
    return auth.error;
  }

  const { orderId } = await context.params;
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    riderNumber: url.searchParams.get("riderNumber") ?? undefined,
  });
  const riderNumberFromQr = parsed.success ? parsed.data.riderNumber : undefined;

  const result = await getRiderOrderAccess({
    orderId,
    riderId: auth.rider.id,
    riderNumberFromQr,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, ...result.order });
}
