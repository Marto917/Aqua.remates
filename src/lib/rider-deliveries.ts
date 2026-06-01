import { sendOrderDeliveredEmail } from "@/lib/order-fulfillment-emails";
import { prisma } from "@/lib/prisma";
import { deliveryCodesMatch } from "@/lib/delivery-code";
import { canConfirmDelivery } from "@/lib/delivery-dispatch";
import { formatFullAddress, RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";

export type RiderDeliveryItem = {
  orderId: string;
  buyerName: string;
  phone: string | null;
  email: string;
  address: string;
  postalCode: string | null;
  deliveryStatus: "DISPATCHED";
  deliveryStatusLabel: string;
  dispatchedAt: string;
};

export async function listRiderDeliveries(): Promise<RiderDeliveryItem[]> {
  const orders = await prisma.retailOrder.findMany({
    where: {
      shippingMethod: "DELIVERY",
      deliveryStatus: "DISPATCHED",
      status: { in: RETAIL_FULFILLMENT_STATUSES },
    },
    orderBy: { deliveryDispatchedAt: "asc" },
    select: {
      id: true,
      buyerName: true,
      buyerPhone: true,
      buyerEmail: true,
      shippingAddress: true,
      shippingCity: true,
      shippingProvince: true,
      shippingPostalCode: true,
      deliveryDispatchedAt: true,
    },
  });

  return orders.map((order) => ({
    orderId: order.id,
    buyerName: order.buyerName,
    phone: order.buyerPhone,
    email: order.buyerEmail,
    address: formatFullAddress(order),
    postalCode: order.shippingPostalCode,
    deliveryStatus: "DISPATCHED" as const,
    deliveryStatusLabel: "En camino",
    dispatchedAt: order.deliveryDispatchedAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export type ConfirmDeliveryResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function confirmRiderDelivery(params: {
  orderId: string;
  code: string;
}): Promise<ConfirmDeliveryResult> {
  const code = params.code.trim();
  if (!/^\d{4}$/.test(code)) {
    return { ok: false, error: "El código debe tener 4 dígitos.", status: 400 };
  }

  const order = await prisma.retailOrder.findUnique({
    where: { id: params.orderId },
    include: { items: true },
  });
  if (!order) {
    return { ok: false, error: "Pedido no encontrado.", status: 404 };
  }
  if (order.shippingMethod !== "DELIVERY") {
    return { ok: false, error: "Este pedido no es un envío a domicilio.", status: 409 };
  }
  if (!canConfirmDelivery(order.deliveryStatus)) {
    return { ok: false, error: "Este pedido no está pendiente de confirmación.", status: 409 };
  }
  if (!order.deliveryCode || !deliveryCodesMatch(order.deliveryCode, code)) {
    return { ok: false, error: "Código incorrecto.", status: 403 };
  }

  await prisma.retailOrder.update({
    where: { id: params.orderId },
    data: {
      deliveryStatus: "DELIVERED",
      deliveryDeliveredAt: new Date(),
    },
  });

  await sendOrderDeliveredEmail(order);

  return { ok: true };
}
