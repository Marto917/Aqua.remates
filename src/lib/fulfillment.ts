import type { DeliveryDispatchStatus, RetailOrderStatus, RetailShippingMethod } from "@prisma/client";
import { RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";

export function isInFulfillmentQueue(status: RetailOrderStatus): boolean {
  return RETAIL_FULFILLMENT_STATUSES.includes(status);
}

export function isOrderPacked(packedAt: Date | null | undefined): boolean {
  return packedAt != null;
}

export function canMarkPacked(packedAt: Date | null | undefined, status: RetailOrderStatus): boolean {
  return isInFulfillmentQueue(status) && !isOrderPacked(packedAt);
}

export function canDispatchAfterPack(
  method: RetailShippingMethod,
  packedAt: Date | null | undefined,
  deliveryStatus: DeliveryDispatchStatus | null | undefined,
): boolean {
  if (method !== "DELIVERY") return false;
  if (!isOrderPacked(packedAt)) return false;
  return deliveryStatus === "PENDING" || deliveryStatus == null;
}

export function canAssignRider(
  packedAt: Date | null | undefined,
  deliveryStatus: DeliveryDispatchStatus | null | undefined,
): boolean {
  if (!isOrderPacked(packedAt)) return false;
  if (deliveryStatus === "DELIVERED") return false;
  return true;
}

export function fulfillmentStatusLabel(params: {
  packedAt: Date | null | undefined;
  shippingMethod: RetailShippingMethod;
  deliveryStatus: DeliveryDispatchStatus | null | undefined;
}): string {
  const { packedAt, shippingMethod, deliveryStatus } = params;
  if (!isOrderPacked(packedAt)) {
    return "Pendiente de armar";
  }
  if (shippingMethod === "DELIVERY") {
    if (deliveryStatus === "DELIVERED") return "Entregado";
    if (deliveryStatus === "DISPATCHED") return "Armado · en camino";
    return "Armado · pendiente de salir";
  }
  if (shippingMethod === "PICKUP") {
    return "Armado · listo para retiro";
  }
  return "Armado · envío a coordinar";
}
