import { NextResponse } from "next/server";
import { getSafeSession } from "@/lib/get-session";
import { canCustomerAccessOrder } from "@/lib/order-access";
import { sendOrderReceivedEmail } from "@/lib/order-transaction-emails";
import { checkRateLimit, RATE_LIMITS, recordRateLimitAttempt } from "@/lib/rate-limit";
import { saveTransferReceiptFile } from "@/lib/save-receipt-file";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getSafeSession();
  const { orderId } = await params;
  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  if (!canCustomerAccessOrder(order, session)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const proofLimit = RATE_LIMITS.transferProofOrder(orderId);
  const proofCheck = await checkRateLimit(proofLimit);
  if (!proofCheck.allowed) {
    return NextResponse.json({ error: proofCheck.message }, { status: 429 });
  }
  if (order.paymentMethod !== "BANK_TRANSFER") {
    return NextResponse.json({ error: "Este pedido no es por transferencia." }, { status: 400 });
  }
  if (order.status === "CANCELLED" || order.status === "CONFIRMED") {
    return NextResponse.json({ error: "Este pedido ya no admite comprobantes." }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("proofFile");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Subí un archivo del comprobante (PDF o imagen)." }, { status: 400 });
  }

  const allowed =
    file.type === "application/pdf" ||
    file.type.startsWith("image/");
  if (!allowed) {
    return NextResponse.json({ error: "Formato no admitido. Usá PDF, JPG o PNG." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const proofUrl = await saveTransferReceiptFile(buffer, file.type);
    const wasPendingTransfer = order.status === "PENDING_TRANSFER";
    const updated = await prisma.retailOrder.update({
      where: { id: orderId },
      data: {
        transferProofUrl: proofUrl,
        transferProofUploadedAt: new Date(),
        status: "TRANSFER_REPORTED",
      },
      include: { items: true },
    });

    if (wasPendingTransfer) {
      try {
        await sendOrderReceivedEmail(updated);
      } catch (e) {
        console.error("Email pedido recibido:", e);
      }
    }

    await recordRateLimitAttempt(proofLimit);

    return NextResponse.json({ ok: true, proofUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo guardar el comprobante.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
