import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Emails (separados por coma) autorizados a borrar sus propias compras en /cuenta/mis-compras.
 * Solo para cuentas de prueba / dueño. Vacío = nadie puede borrar.
 */
export function customerOrderDeleteAllowlist(): string[] {
  const raw = process.env.CUSTOMER_ORDER_DELETE_EMAILS?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

export function canSessionDeleteOwnOrders(session: Session | null): boolean {
  if (!session?.user?.id) return false;
  if (session.user.role !== UserRole.CUSTOMER) return false;
  const email = session.user.email?.trim();
  if (!email) return false;
  const allow = customerOrderDeleteAllowlist();
  if (allow.length === 0) return false;
  return allow.includes(normalizeEmail(email));
}
