import { prisma } from "@/lib/prisma";

export function formatRiderNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

export async function allocateNextRiderNumber(): Promise<number> {
  const agg = await prisma.rider.aggregate({ _max: { riderNumber: true } });
  return (agg._max.riderNumber ?? 0) + 1;
}

export async function findRiderByNumber(riderNumber: number) {
  return prisma.rider.findUnique({
    where: { riderNumber },
    select: { id: true, riderNumber: true, name: true, isActive: true },
  });
}
