import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logWholesaleRequestEvent(
  requestId: string,
  userId: string | null,
  action: string,
  payload?: Prisma.InputJsonValue,
) {
  await prisma.wholesaleRequestEvent.create({
    data: { requestId, userId, action, payload },
  });
}
