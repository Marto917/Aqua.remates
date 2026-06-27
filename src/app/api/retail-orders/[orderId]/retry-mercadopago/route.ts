import { NextResponse } from "next/server";
import { getSafeSession } from "@/lib/get-session";
import { canCustomerAccessOrder } from "@/lib/order-access";
import { createMercadoPagoCheckoutForOrder } from "@/lib/retry-mercadopago-checkout";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getSafeSession();
  const { orderId } = await params;

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, buyerEmail: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  if (!canCustomerAccessOrder(order, session)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const result = await createMercadoPagoCheckoutForOrder(orderId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo reintentar el pago.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
