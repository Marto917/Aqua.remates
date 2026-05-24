import { NextResponse } from "next/server";
import { z } from "zod";
import { extractBearerToken, verifyRiderToken } from "@/lib/rider-auth";
import { confirmRiderDelivery } from "@/lib/rider-deliveries";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orderId: z.string().min(1),
  code: z.string().min(4).max(4),
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
    select: { id: true, isActive: true },
  });

  if (!rider?.isActive) {
    return { error: NextResponse.json({ error: "Cuenta inactiva." }, { status: 403 }) };
  }

  return { rider };
}

/** Finaliza una entrega validando el código de 4 dígitos del cliente. */
export async function POST(req: Request) {
  const auth = await requireActiveRider(req);
  if ("error" in auth && auth.error) {
    return auth.error;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const result = await confirmRiderDelivery(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
