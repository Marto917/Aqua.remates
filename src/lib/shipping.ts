import type { RetailOrderStatus, RetailShippingMethod } from "@prisma/client";

/** Pedidos listos para preparar retiro o envío. */
export const RETAIL_FULFILLMENT_STATUSES: RetailOrderStatus[] = [
  "CONFIRMED",
  "PAYMENT_APPROVED",
  "TRANSFER_REPORTED",
];

export type ShippingOrderType = "retail" | "wholesale";

export type ShippingAddressFields = {
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  shippingPostalCode?: string | null;
};

export function formatFullAddress(fields: ShippingAddressFields): string {
  const parts = [fields.shippingAddress, fields.shippingCity, fields.shippingProvince]
    .map((p) => p?.trim())
    .filter(Boolean);
  let line = parts.join(", ");
  const cp = fields.shippingPostalCode?.trim();
  if (cp) {
    line = line ? `${line} · CP ${cp}` : `CP ${cp}`;
  }
  return line;
}

export function formatCustomerComments(params: {
  shippingNotes?: string | null;
  notes?: string | null;
}): string {
  const parts = [params.shippingNotes?.trim(), params.notes?.trim()].filter(Boolean);
  return parts.join(" · ");
}

export type ShippingQrPayload = {
  v: 1;
  type: ShippingOrderType;
  orderId: string;
  buyerName: string;
  phone: string | null;
  address: string;
  postalCode: string | null;
};

export function buildShippingQrPayload(params: ShippingQrPayload): string {
  return JSON.stringify(params);
}

export function isHomeDelivery(method: RetailShippingMethod): boolean {
  return method === "DELIVERY";
}

export function shippingMethodBadgeClass(method: RetailShippingMethod): string {
  switch (method) {
    case "DELIVERY":
      return "bg-sky-100 text-sky-900";
    case "PICKUP":
      return "bg-violet-100 text-violet-900";
    default:
      return "bg-amber-100 text-amber-900";
  }
}
