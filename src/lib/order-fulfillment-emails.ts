import type { RetailOrder, RetailOrderItem } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/app-url";
import { formatArs } from "@/lib/currency";
import { buildBrandedEmailHtml, emailMisComprasFooter } from "@/lib/email-layout";
import { retailShippingMethodLabel } from "@/lib/order-labels";
import { sendEmail } from "@/lib/send-email";
import { isRidersAppEnabled } from "@/lib/riders-feature";
import { isHomeDelivery } from "@/lib/shipping";

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

function misComprasUrl(): string {
  return `${getAppBaseUrl()}/cuenta/mis-compras`;
}

export async function sendOrderPackedEmail(order: OrderWithItems): Promise<void> {
  const method = order.shippingMethod;
  const isPickup = method === "PICKUP";
  const isDelivery = isHomeDelivery(method);
  const ridersOn = await isRidersAppEnabled();

  let headline = "Tu pedido ya está armado";
  let detail =
    "<p>Preparamos todos los productos de tu compra. Te avisamos cuando haya novedades del envío.</p>";

  if (isPickup) {
    headline = "Tu pedido está listo para retirar";
    detail =
      "<p>Ya podés pasar por la sucursal a retirarlo. Traé un documento y mencioná tu nombre o el mail de la compra.</p>";
  } else if (isDelivery) {
    detail = ridersOn
      ? "<p>El pedido saldrá en breve con el repartidor. Cuando esté en camino te enviaremos otro mail con el código de entrega.</p>"
      : "<p>El pedido está listo para salir a domicilio. Te contactaremos para coordinar la entrega.</p>";
  } else {
    detail =
      "<p>Un vendedor te va a contactar para coordinar el envío. Si tenés dudas, respondé al mail de confirmación.</p>";
  }

  const bodyHtml = `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    ${detail}
    <p>Forma de entrega: <strong>${retailShippingMethodLabel[method]}</strong></p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
    <h2 style="font-size:1rem;margin-top:1.25rem;color:#0f172a">Productos</h2>
    <ul style="padding-left:1.25rem;margin:0">${itemsHtml(order.items)}</ul>
  `;

  const html = await buildBrandedEmailHtml({
    title: headline,
    bodyHtml,
    footerHtml: emailMisComprasFooter(),
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: `AQUA — ${headline}`,
    html,
    text: [
      headline,
      `Hola ${order.buyerName}`,
      `Entrega: ${retailShippingMethodLabel[method]}`,
      "Productos:",
      itemsText(order.items),
      misComprasUrl(),
    ].join("\n"),
  });
}

export async function sendOrderDispatchedEmail(
  order: OrderWithItems,
  deliveryCode: string,
): Promise<void> {
  const bodyHtml = `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    <p>El repartidor ya salió con tu pedido. Cuando llegue, mostrale este código de 4 dígitos:</p>
    <p style="font-size:1.75rem;font-weight:700;letter-spacing:0.2em;color:#0369a1;text-align:center;margin:20px 0">${deliveryCode}</p>
    <p>Dirección: ${[order.shippingAddress, order.shippingCity, order.shippingProvince].filter(Boolean).join(", ") || "—"}</p>
    <h2 style="font-size:1rem;margin-top:1.25rem;color:#0f172a">Productos</h2>
    <ul style="padding-left:1.25rem;margin:0">${itemsHtml(order.items)}</ul>
  `;

  const html = await buildBrandedEmailHtml({
    title: "Tu pedido va en camino",
    bodyHtml,
    footerHtml: emailMisComprasFooter(),
    preheader: `Código de entrega: ${deliveryCode}`,
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Tu pedido va en camino",
    html,
    text: [
      "Tu pedido va en camino.",
      `Código de entrega: ${deliveryCode}`,
      itemsText(order.items),
      misComprasUrl(),
    ].join("\n"),
  });
}

export async function sendOrderDeliveredEmail(order: OrderWithItems): Promise<void> {
  const bodyHtml = `
    <p>Hola <strong>${order.buyerName}</strong>,</p>
    <p>Confirmamos la entrega de tu pedido. ¡Gracias por comprar en AQUA!</p>
    <p>Total: <strong>${formatArs(Number(order.totalAmount))}</strong></p>
  `;

  const html = await buildBrandedEmailHtml({
    title: "Entrega confirmada",
    bodyHtml,
    footerHtml: emailMisComprasFooter(),
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: "AQUA — Entrega confirmada",
    html,
    text: ["Entrega confirmada.", `Total: ${formatArs(Number(order.totalAmount))}`, misComprasUrl()].join(
      "\n",
    ),
  });
}
