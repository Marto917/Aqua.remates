import { createCheckoutPreference } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import type { ResolvedRetailLine } from "@/lib/retail-cart";

export async function createMercadoPagoCheckoutForOrder(
  orderId: string,
): Promise<{ initPoint: string; orderId: string }> {
  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Pedido no encontrado.");
  }
  if (order.paymentMethod !== "MERCADO_PAGO") {
    throw new Error("Este pedido no es de Mercado Pago.");
  }
  if (order.status !== "PENDING_PAYMENT") {
    throw new Error("Este pedido ya no admite reintento de pago.");
  }

  const lines: ResolvedRetailLine[] = order.items.map((it) => ({
    variantId: it.variantId ?? it.productId,
    productId: it.productId,
    categoryId: "",
    productName: it.productName,
    variantColorLabel: it.variantColorLabel ?? "",
    quantity: it.quantity,
    unitPrice: Number(it.unitPrice),
    subtotal: Number(it.subtotal),
  }));

  const { preferenceId, initPoint } = await createCheckoutPreference({
    orderId: order.id,
    buyerEmail: order.buyerEmail,
    buyerName: order.buyerName,
    lines,
    shippingAmount: Number(order.shippingAmount),
    totalAmount: Number(order.totalAmount),
  });

  await prisma.retailOrder.update({
    where: { id: order.id },
    data: { mercadoPagoPreferenceId: preferenceId },
  });

  return { initPoint, orderId: order.id };
}
