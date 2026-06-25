import type { RetailOrder, RetailOrderItem } from "@prisma/client";
import { formatArs } from "@/lib/currency";
import { buildBrandedEmailHtml, emailMisComprasFooter } from "@/lib/email-layout";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { sendEmail } from "@/lib/send-email";

type OrderWithItems = RetailOrder & { items: RetailOrderItem[] };

function itemsHtml(items: RetailOrderItem[]): string {
  return items
    .map(
      (it) =>
        `<li style="margin-bottom:6px"><strong>${it.quantity}×</strong> ${it.productName}${
          it.variantColorLabel ? ` <span style="color:#64748b">(${it.variantColorLabel})</span>` : ""
        }</li>`,
    )
    .join("");
}

function itemsText(items: RetailOrderItem[]): string {
  return items
    .map(
      (it) =>
        `- ${it.quantity}× ${it.productName}${it.variantColorLabel ? ` (${it.variantColorLabel})` : ""}`,
    )
    .join("\n");
}

export async function sendOrderReceivedEmail(order: OrderWithItems): Promise<void> {
  const bodyHtml = `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    <p>Registramos tu compra correctamente. Te avisaremos cuando el pago quede confirmado.</p>
    <p>Entrega: <strong>${retailShippingMethodLabel[order.shippingMethod]}</strong></p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
    <h2 style="font-size:1rem;margin-top:1.25rem;color:#0f172a">Productos</h2>
    <ul style="padding-left:1.25rem;margin:0">${itemsHtml(order.items)}</ul>
  `;

  const html = await buildBrandedEmailHtml({
    title: "Recibimos tu pedido",
    bodyHtml,
    footerHtml: emailMisComprasFooter(),
    preheader: `Pedido registrado por ${formatArs(Number(order.totalAmount))}`,
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Pedido recibido",
    html,
    text: ["Recibimos tu pedido.", `Total: ${formatArs(Number(order.totalAmount))}`, itemsText(order.items)].join(
      "\n",
    ),
  });
}

export async function sendPaymentApprovedEmail(order: OrderWithItems): Promise<void> {
  const bodyHtml = `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    <p>Confirmamos el pago de tu pedido. Ya lo estamos preparando.</p>
    <p>Estado: <strong>${retailOrderStatusLabel.CONFIRMED}</strong></p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
    <h2 style="font-size:1rem;margin-top:1.25rem;color:#0f172a">Productos</h2>
    <ul style="padding-left:1.25rem;margin:0">${itemsHtml(order.items)}</ul>
  `;

  const html = await buildBrandedEmailHtml({
    title: "Pago confirmado",
    bodyHtml,
    footerHtml: emailMisComprasFooter(),
    preheader: "Tu pago fue confirmado",
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Pago confirmado",
    html,
    text: ["Pago confirmado.", `Total: ${formatArs(Number(order.totalAmount))}`, itemsText(order.items)].join("\n"),
  });
}
