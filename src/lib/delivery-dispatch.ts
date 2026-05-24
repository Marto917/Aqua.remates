import type { DeliveryDispatchStatus, RetailShippingMethod } from "@prisma/client";

export function isDeliveryShipping(method: RetailShippingMethod): boolean {
  return method === "DELIVERY";
}

export function initialDeliveryStatus(
  method: RetailShippingMethod,
): DeliveryDispatchStatus | null {
  return isDeliveryShipping(method) ? "PENDING" : null;
}

export function deliveryDispatchStatusLabel(
  status: DeliveryDispatchStatus | null | undefined,
): string {
  switch (status) {
    case "PENDING":
      return "Pendiente de envío";
    case "DISPATCHED":
      return "En camino";
    case "DELIVERED":
      return "Entregado";
    default:
      return "—";
  }
}

export function canDispatchDelivery(
  method: RetailShippingMethod,
  status: DeliveryDispatchStatus | null | undefined,
): boolean {
  if (!isDeliveryShipping(method)) return false;
  return status === "PENDING" || status == null;
}

export function canConfirmDelivery(
  status: DeliveryDispatchStatus | null | undefined,
): boolean {
  return status === "DISPATCHED";
}
