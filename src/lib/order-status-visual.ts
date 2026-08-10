import type {
  DeliveryDispatchStatus,
  RetailOrderStatus,
  RetailShippingMethod,
} from "@prisma/client";

/**
 * Tonos de bandeja para vendedores.
 * Incluye los que pidió el negocio + los operativos que faltaban.
 */
export type OrderStatusTone =
  | "new"
  | "attention"
  | "seen"
  | "fulfillment"
  | "done"
  | "rejected";

export type RetailOrderVisualInput = {
  status: RetailOrderStatus;
  staffSeenAt?: Date | string | null;
  packedAt?: Date | string | null;
  shippingMethod?: RetailShippingMethod | null;
  deliveryStatus?: DeliveryDispatchStatus | null;
};

function isFullyFinished(input: RetailOrderVisualInput): boolean {
  const { status, shippingMethod, packedAt, deliveryStatus } = input;
  if (status !== "CONFIRMED" && status !== "PAYMENT_APPROVED") {
    return false;
  }
  if (deliveryStatus === "DELIVERED") return true;

  const method = shippingMethod ?? "PICKUP";
  if (method === "DELIVERY") {
    return false;
  }
  // Retiro o a coordinar: finalizado cuando está confirmado y armado.
  return packedAt != null && status === "CONFIRMED";
}

export function retailOrderStatusTone(input: RetailOrderVisualInput): OrderStatusTone {
  const { status, staffSeenAt } = input;

  if (status === "CANCELLED") return "rejected";
  if (isFullyFinished(input)) return "done";

  // Comprobante a revisar: prioridad alta (no se pierde en “en curso”).
  if (status === "TRANSFER_REPORTED") return "attention";

  // Pagado / confirmado pero todavía hay que armar o entregar.
  if (status === "CONFIRMED" || status === "PAYMENT_APPROVED") {
    return "fulfillment";
  }

  if (!staffSeenAt) return "new";
  return "seen";
}

export const orderStatusToneClasses: Record<
  OrderStatusTone,
  { badge: string; row: string; label: string }
> = {
  new: {
    badge: "bg-orange-100 text-orange-900 ring-1 ring-orange-200/80",
    row: "bg-orange-50/70 hover:bg-orange-50",
    label: "Nuevo",
  },
  attention: {
    badge: "bg-amber-100 text-amber-950 ring-1 ring-amber-300/80",
    row: "bg-amber-50/80 hover:bg-amber-50",
    label: "Revisar pago",
  },
  seen: {
    badge: "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80",
    row: "bg-sky-50/60 hover:bg-sky-50",
    label: "En curso",
  },
  fulfillment: {
    badge: "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80",
    row: "bg-violet-50/60 hover:bg-violet-50",
    label: "Armar / enviar",
  },
  done: {
    badge: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80",
    row: "bg-emerald-50/50 hover:bg-emerald-50/80",
    label: "Finalizado",
  },
  rejected: {
    badge: "bg-rose-100 text-rose-900 ring-1 ring-rose-200/80",
    row: "bg-rose-50/50 hover:bg-rose-50/80",
    label: "Rechazado",
  },
};

/** Cartelito NEW solo si nadie lo abrió y aún no está cerrado. */
export function shouldShowNewBadge(input: RetailOrderVisualInput): boolean {
  if (input.staffSeenAt) return false;
  if (input.status === "CANCELLED") return false;
  if (isFullyFinished(input)) return false;
  return true;
}
