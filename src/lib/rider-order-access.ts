import { prisma } from "@/lib/prisma";
import { formatRiderNumber } from "@/lib/rider-number";
import {
  formatCustomerComments,
  resolveRiderDeliveryAddress,
} from "@/lib/shipping";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { deliveryDispatchStatusLabel } from "@/lib/delivery-dispatch";

export type RiderOrderAccessResult =
  | {
      ok: true;
      order: {
        orderId: string;
        buyerName: string;
        phone: string | null;
        email: string;
        address: string;
        postalCode: string | null;
        customerComments: string;
        shippingMethod: string;
        shippingMethodLabel: string;
        statusLabel: string;
        deliveryStatus: string | null;
        deliveryStatusLabel: string;
        riderNumber: number;
        riderName: string;
      };
    }
  | { ok: false; error: string; status: number };

/**
 * Valida que el repartidor autenticado puede ver/tomar el viaje del QR.
 * Si riderNumberFromQr viene del escaneo, debe coincidir con el asignado.
 */
export async function getRiderOrderAccess(params: {
  orderId: string;
  riderId: string;
  riderNumberFromQr?: number | null;
}): Promise<RiderOrderAccessResult> {
  const order = await prisma.retailOrder.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      buyerName: true,
      buyerPhone: true,
      buyerEmail: true,
      shippingMethod: true,
      shippingAddress: true,
      shippingCity: true,
      shippingProvince: true,
      shippingPostalCode: true,
      shippingNotes: true,
      notes: true,
      status: true,
      deliveryStatus: true,
      assignedRiderId: true,
      assignedRider: {
        select: { id: true, riderNumber: true, name: true, isActive: true },
      },
      customer: {
        select: {
          defaultShippingAddress: true,
          defaultShippingCity: true,
          defaultShippingProvince: true,
          defaultShippingPostalCode: true,
        },
      },
    },
  });

  if (!order) {
    return { ok: false, error: "Pedido no encontrado.", status: 404 };
  }
  if (order.shippingMethod !== "DELIVERY") {
    return { ok: false, error: "Este pedido no es un envío a domicilio.", status: 409 };
  }
  if (!order.assignedRider) {
    return {
      ok: false,
      error: "El vendedor aún no asignó un repartidor a este viaje.",
      status: 409,
    };
  }
  if (!order.assignedRider.isActive) {
    return { ok: false, error: "El repartidor asignado está inactivo.", status: 409 };
  }
  if (order.assignedRiderId !== params.riderId) {
    return {
      ok: false,
      error: `Este viaje está asignado al repartidor ${formatRiderNumber(order.assignedRider.riderNumber)} (${order.assignedRider.name}). No podés tomarlo.`,
      status: 403,
    };
  }
  if (
    params.riderNumberFromQr != null &&
    params.riderNumberFromQr !== order.assignedRider.riderNumber
  ) {
    return {
      ok: false,
      error: `El QR corresponde al repartidor ${formatRiderNumber(order.assignedRider.riderNumber)}. Tu número es ${formatRiderNumber(params.riderNumberFromQr)}.`,
      status: 403,
    };
  }

  const address = resolveRiderDeliveryAddress(order, order.customer);

  return {
    ok: true,
    order: {
      orderId: order.id,
      buyerName: order.buyerName,
      phone: order.buyerPhone,
      email: order.buyerEmail,
      address,
      postalCode: order.shippingPostalCode,
      customerComments: formatCustomerComments({
        shippingNotes: order.shippingNotes,
        notes: order.notes,
      }),
      shippingMethod: order.shippingMethod,
      shippingMethodLabel: retailShippingMethodLabel[order.shippingMethod],
      statusLabel: retailOrderStatusLabel[order.status],
      deliveryStatus: order.deliveryStatus,
      deliveryStatusLabel: deliveryDispatchStatusLabel(order.deliveryStatus),
      riderNumber: order.assignedRider.riderNumber,
      riderName: order.assignedRider.name,
    },
  };
}
