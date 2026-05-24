"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { generateDeliveryCode } from "@/lib/delivery-code";
import { canDispatchDelivery } from "@/lib/delivery-dispatch";

export type DispatchResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export async function dispatchDeliveryAction(orderId: string): Promise<DispatchResult> {
  await requireStaff();

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      shippingMethod: true,
      deliveryStatus: true,
    },
  });

  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (!canDispatchDelivery(order.shippingMethod, order.deliveryStatus)) {
    return { ok: false, error: "Este pedido no puede emitirse como envío." };
  }

  const code = generateDeliveryCode();
  await prisma.retailOrder.update({
    where: { id: orderId },
    data: {
      deliveryCode: code,
      deliveryStatus: "DISPATCHED",
      deliveryDispatchedAt: new Date(),
    },
  });

  revalidatePath("/vendedor/envios");
  revalidatePath(`/vendedor/envios/minorista/${orderId}/ticket`);
  revalidatePath("/cuenta/mis-compras");

  return { ok: true, code };
}

export async function dispatchDeliveryFormAction(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const result = await dispatchDeliveryAction(orderId);
  if (!result.ok) {
    throw new Error(result.error);
  }
}
