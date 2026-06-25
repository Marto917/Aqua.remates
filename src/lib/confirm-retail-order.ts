import { BillingMode, RetailOrderStatus, RetailPaymentMethod } from "@prisma/client";
import { generateDeliveryCode } from "@/lib/delivery-code";
import { sendPaymentApprovedEmail } from "@/lib/order-transaction-emails";
import { prisma } from "@/lib/prisma";
import { isRidersAppEnabled } from "@/lib/riders-feature";
import { isHomeDelivery } from "@/lib/shipping";

const CONFIRMABLE: RetailOrderStatus[] = [
  "PENDING_TRANSFER",
  "TRANSFER_REPORTED",
  "PENDING_PAYMENT",
  "PAYMENT_APPROVED",
];

export async function confirmRetailOrderForCustomer(orderId: string): Promise<void> {
  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    throw new Error("Pedido no encontrado.");
  }
  if (order.status === "CANCELLED") {
    throw new Error("El pedido está cancelado.");
  }
  if (!CONFIRMABLE.includes(order.status) && order.status !== "CONFIRMED") {
    throw new Error("Este pedido no puede confirmarse en este estado.");
  }

  const wasAlreadyConfirmed = order.status === "CONFIRMED";
  const billingMode: BillingMode =
    order.paymentMethod === RetailPaymentMethod.BANK_TRANSFER ? "NEGRO" : "BLANCO";
  const ridersOn = await isRidersAppEnabled();
  const needsCode = ridersOn && isHomeDelivery(order.shippingMethod) && !order.deliveryCode;
  const deliveryCode = needsCode ? generateDeliveryCode() : order.deliveryCode;

  await prisma.retailOrder.update({
    where: { id: orderId },
    data: {
      status: "CONFIRMED",
      billingMode,
      ...(needsCode && deliveryCode
        ? {
            deliveryCode,
            deliveryStatus: order.deliveryStatus ?? "PENDING",
          }
        : {}),
    },
  });

  if (wasAlreadyConfirmed) {
    return;
  }

  try {
    await sendPaymentApprovedEmail(order);
  } catch (e) {
    console.error("Email pago confirmado:", e);
  }
}
