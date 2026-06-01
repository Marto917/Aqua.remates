"use server";

import { revalidatePath } from "next/cache";
import { canDispatchAfterPack, canMarkPacked } from "@/lib/fulfillment";
import { sendOrderDispatchedEmail, sendOrderPackedEmail } from "@/lib/order-fulfillment-emails";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { generateDeliveryCode } from "@/lib/delivery-code";
import { isHomeDelivery, RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";

export type DispatchResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export async function dispatchDeliveryAction(orderId: string): Promise<DispatchResult> {
  await requireStaff();

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (!RETAIL_FULFILLMENT_STATUSES.includes(order.status)) {
    return { ok: false, error: "El pedido no está en la bandeja de envíos." };
  }
  if (!canDispatchAfterPack(order.shippingMethod, order.packedAt, order.deliveryStatus)) {
    return {
      ok: false,
      error: order.packedAt
        ? "Este pedido no puede emitirse como envío en este momento."
        : "Primero tenés que armar el pedido antes de emitir el envío.",
    };
  }

  const code = order.deliveryCode ?? generateDeliveryCode();
  await prisma.retailOrder.update({
    where: { id: orderId },
    data: {
      deliveryCode: code,
      deliveryStatus: "DISPATCHED",
      deliveryDispatchedAt: new Date(),
    },
  });

  if (isHomeDelivery(order.shippingMethod)) {
    await sendOrderDispatchedEmail({ ...order, deliveryCode: code }, code);
  }

  revalidatePath("/vendedor/envios");
  revalidatePath(`/vendedor/envios/minorista/${orderId}/ticket`);
  revalidatePath(`/vendedor/envios/minorista/${orderId}/armar`);
  revalidatePath("/cuenta/mis-compras");

  return { ok: true, code };
}

export type PackResult = { ok: true } | { ok: false; error: string };

export async function markOrderPackedAction(orderId: string): Promise<PackResult> {
  await requireStaff();

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (!canMarkPacked(order.packedAt, order.status)) {
    return { ok: false, error: "Este pedido ya fue armado o no está listo para armar." };
  }

  await prisma.retailOrder.update({
    where: { id: orderId },
    data: { packedAt: new Date() },
  });

  await sendOrderPackedEmail(order);

  revalidatePath("/vendedor/envios");
  revalidatePath(`/vendedor/envios/minorista/${orderId}/armar`);
  revalidatePath(`/vendedor/envios/minorista/${orderId}/ticket`);
  revalidatePath("/cuenta/mis-compras");

  return { ok: true };
}

export async function dispatchDeliveryFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  const result = await dispatchDeliveryAction(orderId);
  if (!result.ok) {
    console.error("dispatchDeliveryFormAction:", result.error);
  }
}
