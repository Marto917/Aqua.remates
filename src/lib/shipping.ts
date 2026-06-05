import type { RetailOrderStatus, RetailShippingMethod } from "@prisma/client";
import { retailShippingMethodLabel } from "@/lib/order-labels";

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

export type CustomerDefaultShipping = {
  defaultShippingAddress?: string | null;
  defaultShippingCity?: string | null;
  defaultShippingProvince?: string | null;
  defaultShippingPostalCode?: string | null;
};

export function customerDefaultToShippingFields(
  customer: CustomerDefaultShipping,
): ShippingAddressFields {
  return {
    shippingAddress: customer.defaultShippingAddress,
    shippingCity: customer.defaultShippingCity,
    shippingProvince: customer.defaultShippingProvince,
    shippingPostalCode: customer.defaultShippingPostalCode,
  };
}

export type OrderAddressInput = ShippingAddressFields & {
  shippingMethod?: RetailShippingMethod | null;
  shippingNotes?: string | null;
  notes?: string | null;
};

/**
 * Dirección para ticket, QR y app de riders. Nunca deja vacío si hay datos parciales o perfil del cliente.
 */
export function resolveRiderDeliveryAddress(
  input: OrderAddressInput,
  customerDefaults?: CustomerDefaultShipping | null,
): string {
  const fromOrder = formatFullAddress(input);
  if (fromOrder.trim()) return fromOrder;

  if (input.shippingMethod === "DELIVERY" && customerDefaults) {
    const fromProfile = formatFullAddress(customerDefaultToShippingFields(customerDefaults));
    if (fromProfile.trim()) return fromProfile;
  }

  const partial = [
    input.shippingAddress?.trim(),
    input.shippingCity?.trim(),
    input.shippingProvince?.trim(),
    input.shippingPostalCode?.trim() ? `CP ${input.shippingPostalCode.trim()}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  if (partial) return partial;

  const legacyNote = input.shippingNotes?.trim() || input.notes?.trim();
  if (legacyNote && input.shippingMethod === "DELIVERY") return legacyNote;

  if (input.shippingMethod === "PICKUP") {
    return `${retailShippingMethodLabel.PICKUP} — sin envío a domicilio`;
  }
  if (input.shippingMethod === "SHIPPING_TO_COORDINATE") {
    return legacyNote || retailShippingMethodLabel.SHIPPING_TO_COORDINATE;
  }

  return legacyNote ?? "";
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
  email: string;
  shippingMethod: RetailShippingMethod;
  /** Campo principal para la app de riders (mismo valor que fullAddress y direccion). */
  address: string;
  fullAddress: string;
  /** Alias en español por compatibilidad con la app de mapas. */
  direccion: string;
  postalCode: string | null;
  /** Repartidor asignado (obligatorio en QR de envío a domicilio). */
  riderNumber: number | null;
  riderId: string | null;
};

export function buildShippingQrPayload(params: ShippingQrPayload): string {
  const address = params.address.trim();
  const payload: Record<string, unknown> = {
    ...params,
    address,
    fullAddress: params.fullAddress.trim() || address,
    direccion: params.direccion.trim() || address,
  };
  if (params.riderNumber != null) {
    payload.riderNumber = params.riderNumber;
    payload.riderId = params.riderId;
  }
  return JSON.stringify(payload);
}

/** Envío a domicilio: ticket/QR solo con pedido armado y repartidor asignado. */
export function canPrintRetailDeliveryTicket(order: {
  shippingMethod: RetailShippingMethod;
  assignedRiderId: string | null | undefined;
  packedAt?: Date | null;
}): boolean {
  if (order.shippingMethod !== "DELIVERY") return true;
  if (!order.packedAt) return false;
  return Boolean(order.assignedRiderId);
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
