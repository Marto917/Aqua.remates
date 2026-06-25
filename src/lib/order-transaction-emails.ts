import type { RetailOrder, RetailOrderItem } from "@prisma/client";
import { formatArs } from "@/lib/currency";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { sendEmail } from "@/lib/send-email";

type OrderWithItems = RetailOrder & { items: RetailOrderItem[] };

function itemsHtml(items: RetailOrderItem[]): string {
  return items
    .map(
      (it) =>
        `<li><strong>${it.quantity}×</strong> ${it.productName}${
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

function misComprasUrl(): string {
  const base = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/cuenta/mis-compras` : "/cuenta/mis-compras";
}

function emailShell(title: string, body: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:520px">
      <h1 style="font-size:1.25rem;color:#0d9488">${title}</h1>
      ${body}
      <p style="margin-top:1.5rem;font-size:0.875rem;color:#64748b">
        AQUA Remates · <a href="${misComprasUrl()}">Ver mis compras</a>
      </p>
    </div>
  `;
}

export async function sendOrderReceivedEmail(order: OrderWithItems): Promise<void> {
  const html = emailShell(
    "Recibimos tu pedido",
    `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    <p>Registramos tu compra correctamente. Te avisaremos cuando el pago quede confirmado.</p>
    <p>Entrega: <strong>${retailShippingMethodLabel[order.shippingMethod]}</strong></p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
    <h2 style="font-size:1rem;margin-top:1.25rem">Productos</h2>
    <ul>${itemsHtml(order.items)}</ul>
  `,
  );

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Pedido recibido",
    html,
    text: [
      "Recibimos tu pedido.",
      `Total: ${formatArs(Number(order.totalAmount))}`,
      itemsText(order.items),
      misComprasUrl(),
    ].join("\n"),
  });
}

export async function sendPaymentApprovedEmail(order: OrderWithItems): Promise<void> {
  const html = emailShell(
    "Pago confirmado",
    `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    <p>Confirmamos el pago de tu pedido. Ya lo estamos preparando.</p>
    <p>Estado: <strong>${retailOrderStatusLabel.CONFIRMED}</strong></p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
    <h2 style="font-size:1rem;margin-top:1.25rem">Productos</h2>
    <ul>${itemsHtml(order.items)}</ul>
  `,
  );

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Pago confirmado",
    html,
    text: [
      "Pago confirmado.",
      `Total: ${formatArs(Number(order.totalAmount))}`,
      itemsText(order.items),
      misComprasUrl(),
    ].join("\n"),
  });
}
