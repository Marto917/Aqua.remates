"use server";

import { revalidatePath } from "next/cache";
import { completeOrderDelivery } from "@/lib/complete-order-delivery";
import { canAssignRider, canDispatchAfterPack, canMarkPacked } from "@/lib/fulfillment";
import { isRidersAppEnabled } from "@/lib/riders-feature";
import { sendOrderDispatchedEmail, sendOrderPackedEmail } from "@/lib/order-fulfillment-emails";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { generateDeliveryCode } from "@/lib/delivery-code";
import { findRiderByNumber } from "@/lib/rider-number";
import { isHomeDelivery, RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";

function parseRiderNumber(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export type DispatchResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export type AssignRiderResult = { ok: true } | { ok: false; error: string };

export async function assignRiderToOrderAction(
  orderId: string,
  riderNumber: number,
): Promise<AssignRiderResult> {
  await requireStaff();
  if (!(await isRidersAppEnabled())) {
    return { ok: false, error: "La app de repartidores está desactivada." };
  }

  const rider = await findRiderByNumber(riderNumber);
  if (!rider) return { ok: false, error: "Repartidor no encontrado." };
  if (!rider.isActive) return { ok: false, error: "El repartidor está inactivo." };

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: { shippingMethod: true, deliveryStatus: true, packedAt: true },
  });
  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (order.shippingMethod !== "DELIVERY") {
    return { ok: false, error: "Solo se asignan repartidores a envíos a domicilio." };
  }
  if (!canAssignRider(order.packedAt, order.deliveryStatus)) {
    return {
      ok: false,
      error: order.packedAt
        ? "El pedido ya fue entregado o no admite cambio de repartidor."
        : "Primero tenés que armar el pedido antes de asignar un repartidor.",
    };
  }

  await prisma.retailOrder.update({
    where: { id: orderId },
    data: {
      assignedRiderId: rider.id,
      riderAssignedAt: new Date(),
    },
  });

  revalidatePath("/vendedor/envios");
  revalidatePath("/vendedor/envios/repartidores");
  revalidatePath(`/vendedor/envios/repartidores/${riderNumber}`);
  revalidatePath(`/vendedor/envios/minorista/${orderId}/ticket`);

  return { ok: true };
}

export async function dispatchDeliveryAction(
  orderId: string,
  riderNumber?: number,
): Promise<DispatchResult> {
  await requireStaff();
  if (!(await isRidersAppEnabled())) {
    return { ok: false, error: "La app de repartidores está desactivada." };
  }

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

  let assignedRiderId = order.assignedRiderId;
  if (riderNumber != null) {
    const resolved = await findRiderByNumber(riderNumber);
    if (!resolved?.isActive) {
      return { ok: false, error: "Repartidor inválido o inactivo." };
    }
    assignedRiderId = resolved.id;
  }
  if (!assignedRiderId) {
    return { ok: false, error: "Asigná un repartidor antes de emitir el envío." };
  }

  const code = order.deliveryCode ?? generateDeliveryCode();
  const now = new Date();
  await prisma.retailOrder.update({
    where: { id: orderId },
    data: {
      assignedRiderId,
      riderAssignedAt: order.riderAssignedAt ?? now,
      deliveryCode: code,
      deliveryStatus: "DISPATCHED",
      deliveryDispatchedAt: now,
    },
  });

  if (isHomeDelivery(order.shippingMethod)) {
    await sendOrderDispatchedEmail({ ...order, deliveryCode: code }, code);
  }

  revalidatePath("/vendedor/envios");
  revalidatePath("/vendedor/envios/repartidores");
  revalidatePath(`/vendedor/envios/minorista/${orderId}/ticket`);
  revalidatePath(`/vendedor/envios/minorista/${orderId}/armar`);
  revalidatePath(`/vendedor/envios/minorista/${orderId}/ticket`);
  revalidatePath("/cuenta/mis-compras");

  return { ok: true, code };
}

export async function assignRiderFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  const riderNumber = parseRiderNumber(formData.get("riderNumber"));
  if (!orderId || riderNumber == null) return;
  const result = await assignRiderToOrderAction(orderId, riderNumber);
  if (!result.ok) console.error("assignRiderFormAction:", result.error);
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

export async function markHomeDeliveredAction(orderId: string): Promise<PackResult> {
  await requireStaff();

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: {
      shippingMethod: true,
      packedAt: true,
      deliveryStatus: true,
      status: true,
    },
  });

  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (order.shippingMethod !== "DELIVERY") {
    return { ok: false, error: "Solo aplica a envío a domicilio." };
  }
  if (!RETAIL_FULFILLMENT_STATUSES.includes(order.status)) {
    return { ok: false, error: "El pedido no está en la bandeja de envíos." };
  }
  if (!order.packedAt) {
    return { ok: false, error: "Primero armá el pedido." };
  }
  if (order.deliveryStatus === "DELIVERED") {
    return { ok: false, error: "Ya fue marcado como entregado." };
  }

  await completeOrderDelivery(orderId);

  return { ok: true };
}

export async function markPickupDeliveredAction(orderId: string): Promise<PackResult> {
  await requireStaff();

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: {
      shippingMethod: true,
      packedAt: true,
      deliveryStatus: true,
      status: true,
    },
  });

  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (order.shippingMethod !== "PICKUP") {
    return { ok: false, error: "Solo aplica a retiro en sucursal." };
  }
  if (!RETAIL_FULFILLMENT_STATUSES.includes(order.status)) {
    return { ok: false, error: "El pedido no está en la bandeja de envíos." };
  }
  if (!order.packedAt) {
    return { ok: false, error: "Primero armá el pedido." };
  }
  if (order.deliveryStatus === "DELIVERED") {
    return { ok: false, error: "Ya fue marcado como entregado." };
  }

  await completeOrderDelivery(orderId);

  return { ok: true };
}

export async function dispatchDeliveryFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  const riderNumber = parseRiderNumber(formData.get("riderNumber"));
  const result = await dispatchDeliveryAction(orderId, riderNumber ?? undefined);
  if (!result.ok) {
    console.error("dispatchDeliveryFormAction:", result.error);
  }
}
