import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CustomerModerationFields = Pick<
  User,
  "bannedUntil" | "banReason" | "transferProofRejectCount" | "accountWarning"
>;

/** Tras limpiar bans vencidos en DB, basta con mirar si hay fecha. */
export function isCustomerCurrentlyBanned(
  user: Pick<CustomerModerationFields, "bannedUntil"> | null | undefined,
): boolean {
  return Boolean(user?.bannedUntil);
}

export function formatBanUntil(until: Date): string {
  return until.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function customerBanMessage(
  user: Pick<CustomerModerationFields, "bannedUntil" | "banReason">,
): string {
  const until = user.bannedUntil!;
  const base = `Tu cuenta está temporalmente suspendida hasta el ${formatBanUntil(until)}.`;
  if (user.banReason?.trim()) {
    return `${base} Motivo: ${user.banReason.trim()}`;
  }
  return `${base} Si creés que es un error, contactanos por WhatsApp.`;
}

async function clearExpiredBan(userId: string, bannedUntil: Date) {
  if (bannedUntil.getTime() > Date.now()) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { bannedUntil: null, banReason: null },
  });
  return true;
}

export async function getCustomerModeration(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      bannedUntil: true,
      banReason: true,
      transferProofRejectCount: true,
      accountWarning: true,
      role: true,
    },
  });
  if (!user?.bannedUntil) return user;
  const cleared = await clearExpiredBan(user.id, user.bannedUntil);
  if (!cleared) return user;
  return { ...user, bannedUntil: null, banReason: null };
}

/** Bloquea compras si hay ban activo. */
export async function assertCustomerNotBanned(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const user = await getCustomerModeration(userId);
  if (!user) {
    return { ok: false, error: "Cuenta no encontrada.", status: 404 };
  }
  if (isCustomerCurrentlyBanned(user)) {
    return { ok: false, error: customerBanMessage(user), status: 403 };
  }
  return { ok: true };
}

export async function recordTransferProofRejection(customerId: string): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: customerId },
    data: { transferProofRejectCount: { increment: 1 } },
    select: { transferProofRejectCount: true },
  });
  return updated.transferProofRejectCount;
}

export async function banCustomer(input: {
  userId: string;
  days: number;
  reason?: string | null;
}): Promise<{ bannedUntil: Date }> {
  const days = Math.min(365, Math.max(1, Math.round(input.days)));
  const bannedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const reason =
    input.reason?.trim() ||
    "Comprobantes de transferencia rechazados de forma reiterada.";

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      bannedUntil,
      banReason: reason,
      accountWarning: true,
    },
  });

  return { bannedUntil };
}

/** Levanta el ban; deja la advertencia histórica. */
export async function unbanCustomer(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      bannedUntil: null,
      banReason: null,
      accountWarning: true,
    },
  });
}

export function shouldShowAccountWarning(
  user: Pick<CustomerModerationFields, "bannedUntil" | "accountWarning">,
): boolean {
  return Boolean(user.accountWarning) && !isCustomerCurrentlyBanned(user);
}
