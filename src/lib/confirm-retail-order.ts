import { BillingMode, RetailOrderStatus, RetailPaymentMethod } from "@prisma/client";
import { generateDeliveryCode } from "@/lib/delivery-code";
import { formatArs } from "@/lib/currency";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/send-email";
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
  const needsCode = isHomeDelivery(order.shippingMethod) && !order.deliveryCode;
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

  const itemsHtml = order.items
    .map(
      (it) =>
        `<li>${it.productName}${it.variantColorLabel ? ` (${it.variantColorLabel})` : ""} × ${it.quantity} — ${formatArs(Number(it.subtotal))}</li>`,
    )
    .join("");

  const codeBlock =
    isHomeDelivery(order.shippingMethod) && deliveryCode
      ? `<p><strong>Código para el repartidor:</strong> ${deliveryCode}</p><p>Mostrá este código cuando recibas el pedido.</p>`
      : "";

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  const misComprasUrl = baseUrl ? `${baseUrl}/cuenta/mis-compras` : "/cuenta/mis-compras";

  const html = `
    <h1>Tu compra en AQUA fue confirmada</h1>
    <p>Hola ${order.buyerName},</p>
    <p>Estado: <strong>${retailOrderStatusLabel.CONFIRMED}</strong></p>
    <p>Envío: ${retailShippingMethodLabel[order.shippingMethod]}</p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
    <h2>Productos</h2>
    <ul>${itemsHtml}</ul>
    ${codeBlock}
    <p>Seguimiento: <a href="${misComprasUrl}">Mis compras</a></p>
  `;

  const textLines = [
    "Tu compra en AQUA fue confirmada.",
    `Total: ${formatArs(Number(order.totalAmount))}`,
    ...order.items.map(
      (it) =>
        `- ${it.productName}${it.variantColorLabel ? ` (${it.variantColorLabel})` : ""} × ${it.quantity}`,
    ),
  ];
  if (deliveryCode && isHomeDelivery(order.shippingMethod)) {
    textLines.push(`Código repartidor: ${deliveryCode}`);
  }
  textLines.push(`Mis compras: ${misComprasUrl}`);

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Compra confirmada",
    html,
    text: textLines.join("\n"),
  });
}
