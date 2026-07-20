import type { RetailOrder, RetailOrderItem } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/app-url";
import { formatArs } from "@/lib/currency";
import {
  buildBrandedEmailHtml,
  emailButton,
  emailMisComprasFooter,
  escapeHtml,
} from "@/lib/email-layout";
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

type PendingTransferBank = {
  holder: string;
  alias: string;
  cbu: string;
  notes?: string | null;
};

/** Mail al crear pedido por transferencia: datos bancarios + link para subir comprobante. */
export async function sendPendingTransferEmail(
  order: OrderWithItems,
  bank: PendingTransferBank,
): Promise<void> {
  const uploadUrl = `${getAppBaseUrl()}/cuenta/mis-compras/${order.id}/comprobante`;
  const total = formatArs(Number(order.totalAmount));
  const notesHtml = bank.notes
    ? `<p style="margin-top:8px;color:#64748b;font-size:14px">${escapeHtml(bank.notes)}</p>`
    : "";

  const bodyHtml = `
    <p>Hola <strong>${escapeHtml(order.buyerName)}</strong>,</p>
    <p>Registramos tu pedido. Para completarlo, transferí el monto exacto y subí el comprobante.</p>
    <p>Entrega: <strong>${retailShippingMethodLabel[order.shippingMethod]}</strong></p>
    <p style="font-size:1.35rem;font-weight:700;color:#0f766e;margin:1rem 0">Total a transferir: ${total}</p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:600;color:#0f172a">Datos para transferir</p>
      <p style="margin:4px 0"><strong>Titular:</strong> ${escapeHtml(bank.holder)}</p>
      <p style="margin:4px 0"><strong>Alias:</strong> ${escapeHtml(bank.alias)}</p>
      <p style="margin:4px 0"><strong>CBU:</strong> ${escapeHtml(bank.cbu)}</p>
      ${notesHtml}
    </div>
    ${emailButton("Subir comprobante", uploadUrl)}
    <p style="font-size:13px;color:#64748b">También podés hacerlo desde <a href="${getAppBaseUrl()}/cuenta/mis-compras">Mis compras</a>.</p>
    <h2 style="font-size:1rem;margin-top:1.25rem;color:#0f172a">Productos</h2>
    <ul style="padding-left:1.25rem;margin:0">${itemsHtml(order.items)}</ul>
  `;

  const html = await buildBrandedEmailHtml({
    title: "Pendiente de transferencia",
    bodyHtml,
    footerHtml: emailMisComprasFooter(),
    preheader: `Transferí ${total} y subí el comprobante`,
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Transferí y subí tu comprobante",
    html,
    text: [
      "Pendiente de transferencia.",
      `Total: ${total}`,
      `Titular: ${bank.holder}`,
      `Alias: ${bank.alias}`,
      `CBU: ${bank.cbu}`,
      `Subí el comprobante: ${uploadUrl}`,
      itemsText(order.items),
    ].join("\n"),
  });
}

export async function sendOrderReceivedEmail(order: OrderWithItems): Promise<void> {
  const bodyHtml = `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    <p>Recibimos tu comprobante. Te avisaremos cuando el pago quede confirmado.</p>
    <p>Entrega: <strong>${retailShippingMethodLabel[order.shippingMethod]}</strong></p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
    <h2 style="font-size:1rem;margin-top:1.25rem;color:#0f172a">Productos</h2>
    <ul style="padding-left:1.25rem;margin:0">${itemsHtml(order.items)}</ul>
  `;

  const html = await buildBrandedEmailHtml({
    title: "Comprobante recibido",
    bodyHtml,
    footerHtml: emailMisComprasFooter(),
    preheader: `Comprobante recibido por ${formatArs(Number(order.totalAmount))}`,
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Comprobante recibido",
    html,
    text: [
      "Recibimos tu comprobante.",
      `Total: ${formatArs(Number(order.totalAmount))}`,
      itemsText(order.items),
    ].join("\n"),
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
