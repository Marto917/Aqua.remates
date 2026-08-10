import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function matchesDefaultOwnerEmail(email: string | null | undefined): boolean {
  const ownerEmail = process.env.DEFAULT_OWNER_EMAIL?.trim();
  if (!ownerEmail || !email?.trim()) return false;
  return normalizeEmail(email) === normalizeEmail(ownerEmail);
}

/**
 * Solo la cuenta cuyo email coincide con DEFAULT_OWNER_EMAIL
 * puede borrar compras propias en /cuenta/mis-compras.
 */
export function canSessionDeleteOwnOrders(session: Session | null): boolean {
  if (!session?.user?.id) return false;
  const role = session.user.role;
  if (role !== UserRole.CUSTOMER && role !== UserRole.OWNER) return false;
  return matchesDefaultOwnerEmail(session.user.email);
}
