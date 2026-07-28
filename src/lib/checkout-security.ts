import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";
import { assertCustomerNotBanned } from "@/lib/customer-moderation";
import { prisma } from "@/lib/prisma";

export const MAX_CHECKOUT_LINES = 30;
export const MAX_QUANTITY_PER_LINE = 50;
export const MAX_PENDING_ORDERS_PER_DAY = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateCheckoutQuantities(
  lines: { quantity: number }[],
): { ok: true } | { ok: false; error: string } {
  if (lines.length > MAX_CHECKOUT_LINES) {
    return { ok: false, error: `Máximo ${MAX_CHECKOUT_LINES} productos distintos por pedido.` };
  }
  for (const line of lines) {
    if (line.quantity > MAX_QUANTITY_PER_LINE) {
      return {
        ok: false,
        error: `La cantidad máxima por producto es ${MAX_QUANTITY_PER_LINE} unidades.`,
      };
    }
  }
  return { ok: true };
}

export function requireVerifiedCustomerSession(
  session: Session | null,
): { ok: true; userId: string; email: string } | { ok: false; error: string; status: number } {
  if (!session?.user?.id) {
    return { ok: false, error: "Iniciá sesión para finalizar la compra.", status: 401 };
  }
  if (session.user.role !== UserRole.CUSTOMER) {
    return { ok: false, error: "Solo clientes pueden comprar en la tienda.", status: 403 };
  }
  if (!session.user.emailVerified) {
    return { ok: false, error: "Verificá tu email antes de comprar.", status: 403 };
  }
  const email = session.user.email?.trim();
  if (!email) {
    return { ok: false, error: "Tu cuenta no tiene email válido.", status: 403 };
  }
  return { ok: true, userId: session.user.id, email };
}

export async function requireVerifiedCustomerNotBanned(
  session: Session | null,
): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; error: string; status: number }
> {
  const auth = requireVerifiedCustomerSession(session);
  if (!auth.ok) return auth;
  const ban = await assertCustomerNotBanned(auth.userId);
  if (!ban.ok) return ban;
  return auth;
}

export function buyerEmailMatchesSession(
  buyerEmail: string,
  sessionEmail: string,
): boolean {
  return normalizeEmail(buyerEmail) === normalizeEmail(sessionEmail);
}

/** Limita pedidos pendientes de pago/transferencia por cliente (anti-spam). */
export async function checkPendingOrdersLimit(
  customerId: string,
): Promise<{ allowed: boolean; message?: string }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.retailOrder.count({
    where: {
      customerId,
      createdAt: { gte: since },
      status: { in: ["PENDING_PAYMENT", "PENDING_TRANSFER", "TRANSFER_REPORTED"] },
    },
  });
  if (count >= MAX_PENDING_ORDERS_PER_DAY) {
    return {
      allowed: false,
      message:
        "Tenés varios pedidos pendientes. Completá o cancelá uno antes de crear otro, o contactanos por WhatsApp.",
    };
  }
  return { allowed: true };
}
