import type {
  DeliveryDispatchStatus,
  RetailOrderStatus,
  RetailShippingMethod,
} from "@prisma/client";
import { retailOrderStatusLabel } from "@/lib/order-labels";
import {
  orderStatusToneClasses,
  retailOrderStatusTone,
  shouldShowNewBadge,
  type OrderStatusTone,
  type RetailOrderVisualInput,
} from "@/lib/order-status-visual";

type Props = {
  status: RetailOrderStatus;
  staffSeenAt?: Date | string | null;
  packedAt?: Date | string | null;
  shippingMethod?: RetailShippingMethod | null;
  deliveryStatus?: DeliveryDispatchStatus | null;
  /** Si se pasa, fuerza el tono (p. ej. demos). */
  tone?: OrderStatusTone;
  className?: string;
};

export function OrderStatusBadge({
  status,
  staffSeenAt,
  packedAt,
  shippingMethod,
  deliveryStatus,
  tone,
  className = "",
}: Props) {
  const input: RetailOrderVisualInput = {
    status,
    staffSeenAt,
    packedAt,
    shippingMethod,
    deliveryStatus,
  };
  const resolved = tone ?? retailOrderStatusTone(input);
  const styles = orderStatusToneClasses[resolved];
  const showNew = shouldShowNewBadge(input);

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
      >
        {retailOrderStatusLabel[status]}
      </span>
      {showNew ? (
        <span className="inline-flex rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          New
        </span>
      ) : null}
      {resolved === "attention" ? (
        <span className="inline-flex rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Revisar
        </span>
      ) : null}
    </span>
  );
}
