import { NextResponse } from "next/server";
import { confirmRetailOrderForCustomer } from "@/lib/confirm-retail-order";
import { fetchMercadoPagoPayment, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mercadopago-webhook-signature";
import { prisma } from "@/lib/prisma";

/** IPN / Webhooks de Mercado Pago (topic=payment). */
export async function POST(req: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const url = new URL(req.url);
  let topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
  let id = url.searchParams.get("id") ?? url.searchParams.get("data.id");

  if (!topic || !id) {
    try {
      const body = (await req.json()) as { type?: string; data?: { id?: string | number } };
      topic = body.type ?? topic;
      id = body.data?.id != null ? String(body.data.id) : id;
    } catch {
      /* query-only webhook */
    }
  }

  if (topic !== "payment" || !id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const signature = verifyMercadoPagoWebhookSignature(req, id);
  if (!signature.ok) {
    console.warn("[MP webhook] Firma rechazada:", signature.reason);
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payment = await fetchMercadoPagoPayment(id);
    const orderId = payment.external_reference;
    if (!orderId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const order = await prisma.retailOrder.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== "MERCADO_PAGO") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const status = payment.status;
    if (status === "approved") {
      await prisma.retailOrder.update({
        where: { id: orderId },
        data: {
          mercadoPagoPaymentId: String(payment.id ?? id),
          ...(order.status === "PENDING_PAYMENT" ? { status: "PAYMENT_APPROVED" } : {}),
        },
      });
      try {
        await confirmRetailOrderForCustomer(orderId);
      } catch (e) {
        console.error("Confirmación post-MP:", e);
      }
    } else if (status === "cancelled" || status === "rejected") {
      // Mantener PENDING_PAYMENT para que el cliente pueda reintentar el mismo pedido.
      await prisma.retailOrder.update({
        where: { id: orderId },
        data: { mercadoPagoPaymentId: String(payment.id ?? id) },
      });
    }
  } catch (e) {
    console.error("Mercado Pago webhook error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  return POST(req);
}
