import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Días en papelera antes del borrado definitivo. */
export const RETAIL_ORDER_TRASH_DAYS = 15;

/** Filtro para pedidos activos (no están en la papelera). */
export const retailOrderNotDeleted: Prisma.RetailOrderWhereInput = {
  deletedAt: null,
};

export function trashPurgeDeadline(deletedAt: Date): Date {
  const d = new Date(deletedAt);
  d.setDate(d.getDate() + RETAIL_ORDER_TRASH_DAYS);
  return d;
}

export function daysLeftInTrash(deletedAt: Date, now = new Date()): number {
  const ms = trashPurgeDeadline(deletedAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export async function softDeleteRetailOrder(params: {
  orderId: string;
  deletedById?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.retailOrder.findUnique({
    where: { id: params.orderId },
    select: { id: true, deletedAt: true },
  });
  if (!existing) {
    return { ok: false, error: "Pedido no encontrado." };
  }
  if (existing.deletedAt) {
    return { ok: false, error: "El pedido ya está en la papelera." };
  }

  await prisma.retailOrder.update({
    where: { id: params.orderId },
    data: {
      deletedAt: new Date(),
      deletedById: params.deletedById ?? null,
    },
  });

  return { ok: true };
}

export async function softDeleteRetailOrdersWhere(
  where: Prisma.RetailOrderWhereInput,
  deletedById?: string | null,
): Promise<number> {
  const result = await prisma.retailOrder.updateMany({
    where: { AND: [where, { deletedAt: null }] },
    data: {
      deletedAt: new Date(),
      deletedById: deletedById ?? null,
    },
  });
  return result.count;
}

export async function restoreRetailOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: { id: true, deletedAt: true },
  });
  if (!existing) {
    return { ok: false, error: "Pedido no encontrado." };
  }
  if (!existing.deletedAt) {
    return { ok: false, error: "El pedido no está en la papelera." };
  }

  await prisma.retailOrder.update({
    where: { id: orderId },
    data: { deletedAt: null, deletedById: null },
  });

  return { ok: true };
}

export async function permanentlyDeleteRetailOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: { id: true, deletedAt: true },
  });
  if (!existing) {
    return { ok: false, error: "Pedido no encontrado." };
  }
  if (!existing.deletedAt) {
    return { ok: false, error: "Solo se puede borrar definitivo desde la papelera." };
  }

  await prisma.$transaction([
    prisma.retailOrderItem.deleteMany({ where: { orderId } }),
    prisma.retailOrder.delete({ where: { id: orderId } }),
  ]);

  return { ok: true };
}

/** Borra de verdad los pedidos que llevan más de RETAIL_ORDER_TRASH_DAYS en papelera. */
export async function purgeExpiredTrashedRetailOrders(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETAIL_ORDER_TRASH_DAYS);

  const expired = await prisma.retailOrder.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
    },
    select: { id: true },
    take: 200,
  });

  if (expired.length === 0) return 0;

  const ids = expired.map((o) => o.id);
  await prisma.$transaction([
    prisma.retailOrderItem.deleteMany({ where: { orderId: { in: ids } } }),
    prisma.retailOrder.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return ids.length;
}
