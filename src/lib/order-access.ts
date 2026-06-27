import type { RetailOrder } from "@prisma/client";
import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Verifica que el pedido pertenezca al cliente autenticado. */
export function canCustomerAccessOrder(
  order: Pick<RetailOrder, "customerId" | "buyerEmail">,
  session: Session | null,
): boolean {
  if (!session?.user?.id) return false;
  if (session.user.role !== UserRole.CUSTOMER) return false;

  if (order.customerId && order.customerId === session.user.id) return true;

  const sessionEmail = session.user.email?.trim();
  if (sessionEmail && normalizeEmail(order.buyerEmail) === normalizeEmail(sessionEmail)) {
    return true;
  }

  return false;
}
