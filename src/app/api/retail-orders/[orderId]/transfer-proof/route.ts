import { NextResponse } from "next/server";
import { saveTransferReceiptImage } from "@/lib/save-receipt-image";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = await prisma.retailOrder.findUnique({ where: { id: orderId } });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
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
    return NextResponse.json({ error: "Subí una imagen del comprobante." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const proofUrl = await saveTransferReceiptImage(buffer);
    await prisma.retailOrder.update({
      where: { id: orderId },
      data: {
        transferProofUrl: proofUrl,
        transferProofUploadedAt: new Date(),
        status: "TRANSFER_REPORTED",
      },
    });
    return NextResponse.json({ ok: true, proofUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo guardar el comprobante.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
