import { prisma } from "@/lib/prisma";
import { purgeExpiredTrashedRetailOrders } from "@/lib/retail-order-trash";

const DELIVERED_ORDER_RETENTION_DAYS = 30;
const INACTIVE_USER_RETENTION_DAYS = 90;

/** Cuentas de cliente sin verificar cuyo enlace venció (48 h). */
export async function purgeUnverifiedCustomerAccounts(): Promise<number> {
  const now = new Date();

  const staleUsers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      emailVerified: null,
      emailVerificationExpires: { lt: now },
      retailOrders: { none: {} },
      wholesaleRequests: { none: {} },
    },
    select: { id: true, email: true },
    take: 200,
  });

  if (staleUsers.length === 0) return 0;

  const ids = staleUsers.map((u) => u.id);
  const emails = staleUsers.map((u) => u.email.toLowerCase());

  await prisma.$transaction([
    prisma.verificationEmailThrottle.deleteMany({ where: { email: { in: emails } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return ids.length;
}

export async function purgeOldDeliveredOrders(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELIVERED_ORDER_RETENTION_DAYS);

  const result = await prisma.retailOrder.deleteMany({
    where: {
      deletedAt: null,
      deliveryStatus: "DELIVERED",
      deliveryDeliveredAt: { lt: cutoff },
    },
  });

  return result.count;
}

export async function purgeInactiveCustomerAccounts(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INACTIVE_USER_RETENTION_DAYS);

  const staleUsers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: [{ lastActiveAt: { lt: cutoff } }, { lastActiveAt: null, createdAt: { lt: cutoff } }],
    },
    select: { id: true },
    take: 200,
  });

  if (staleUsers.length === 0) return 0;

  const ids = staleUsers.map((u) => u.id);
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

export async function runDataRetention(): Promise<{
  orders: number;
  trash: number;
  users: number;
  unverifiedUsers: number;
}> {
  const [orders, trash, users, unverifiedUsers] = await Promise.all([
    purgeOldDeliveredOrders(),
    purgeExpiredTrashedRetailOrders(),
    purgeInactiveCustomerAccounts(),
    purgeUnverifiedCustomerAccounts(),
  ]);
  return { orders, trash, users, unverifiedUsers };
}
