import { NextResponse } from "next/server";
import { createMercadoPagoCheckoutForOrder } from "@/lib/retry-mercadopago-checkout";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  try {
    const result = await createMercadoPagoCheckoutForOrder(orderId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo reintentar el pago.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
