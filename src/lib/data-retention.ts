import { prisma } from "@/lib/prisma";

const DELIVERED_ORDER_RETENTION_DAYS = 30;
const INACTIVE_USER_RETENTION_DAYS = 90;

export async function purgeOldDeliveredOrders(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELIVERED_ORDER_RETENTION_DAYS);

  const result = await prisma.retailOrder.deleteMany({
    where: {
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

export async function runDataRetention(): Promise<{ orders: number; users: number }> {
  const [orders, users] = await Promise.all([
    purgeOldDeliveredOrders(),
    purgeInactiveCustomerAccounts(),
  ]);
  return { orders, users };
}
