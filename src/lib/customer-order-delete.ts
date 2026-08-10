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
 * Dueño (OWNER) cuyo mail coincide con DEFAULT_OWNER_EMAIL.
 * Si DEFAULT_OWNER_EMAIL no está seteado, alcanza con ser OWNER.
 */
export function canOwnerDeleteRetailOrders(session: Session | null): boolean {
  if (!session?.user?.id) return false;
  if (session.user.role !== UserRole.OWNER) return false;
  const configured = process.env.DEFAULT_OWNER_EMAIL?.trim();
  if (!configured) return true;
  return matchesDefaultOwnerEmail(session.user.email);
}

/** @deprecated alias — usar canOwnerDeleteRetailOrders */
export function canSessionDeleteOwnOrders(session: Session | null): boolean {
  return canOwnerDeleteRetailOrders(session);
}
