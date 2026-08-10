"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { canCustomerAccessOrder } from "@/lib/order-access";
import { canSessionDeleteOwnOrders, matchesDefaultOwnerEmail } from "@/lib/customer-order-delete";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export type DeleteOwnOrderResult = { ok: true } | { ok: false; error: string };

function orderBelongsToSession(
  order: { customerId: string | null; buyerEmail: string },
  session: NonNullable<Awaited<ReturnType<typeof getSafeSession>>>,
): boolean {
  if (session.user.role === UserRole.CUSTOMER) {
    return canCustomerAccessOrder(order, session);
  }
  // OWNER con el mismo mail que DEFAULT_OWNER_EMAIL: pedidos ligados a su user o email.
  if (session.user.role === UserRole.OWNER && matchesDefaultOwnerEmail(session.user.email)) {
    if (order.customerId && order.customerId === session.user.id) return true;
    const sessionEmail = session.user.email?.trim().toLowerCase() ?? "";
    return Boolean(sessionEmail) && order.buyerEmail.trim().toLowerCase() === sessionEmail;
  }
  return false;
}

export async function deleteOwnRetailOrder(orderId: string): Promise<DeleteOwnOrderResult> {
  const session = await getSafeSession();
  if (!canSessionDeleteOwnOrders(session) || !session) {
    return { ok: false, error: "No tenés permiso para borrar compras." };
  }

  const id = orderId.trim();
  if (!id) {
    return { ok: false, error: "Pedido inválido." };
  }

  const order = await prisma.retailOrder.findUnique({
    where: { id },
    select: { id: true, customerId: true, buyerEmail: true },
  });

  if (!order) {
    return { ok: false, error: "Pedido no encontrado." };
  }

  if (!orderBelongsToSession(order, session)) {
    return { ok: false, error: "Ese pedido no es de tu cuenta." };
  }

  await prisma.retailOrder.delete({ where: { id: order.id } });

  revalidatePath("/cuenta/mis-compras");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function deleteAllOwnRetailOrders(): Promise<DeleteOwnOrderResult> {
  const session = await getSafeSession();
  if (!canSessionDeleteOwnOrders(session) || !session?.user?.id) {
    return { ok: false, error: "No tenés permiso para borrar compras." };
  }

  const email = session.user.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return { ok: false, error: "No tenés permiso para borrar compras." };
  }

  await prisma.retailOrder.deleteMany({
    where: {
      OR: [{ customerId: session.user.id }, { buyerEmail: email }],
    },
  });

  revalidatePath("/cuenta/mis-compras");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}
