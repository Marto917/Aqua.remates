type Props = {
  deliveredAt?: Date | string | null;
  variant?: "staff" | "customer";
  buyerName?: string;
  compact?: boolean;
};

function formatDeliveredAt(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export function DeliveryDeliveredNotice({
  deliveredAt,
  variant = "staff",
  buyerName,
  compact = false,
}: Props) {
  const when = formatDeliveredAt(deliveredAt);
  const isCustomer = variant === "customer";

  const title = isCustomer
    ? "¡Tu pedido fue entregado!"
    : buyerName
      ? `Pedido entregado — ${buyerName}`
      : "Pedido entregado";

  const detail = isCustomer
    ? "El repartidor confirmó la entrega con el código de 4 dígitos. También te enviamos un correo de confirmación."
    : "El repartidor confirmó la entrega desde RodMaps con el código del cliente.";

  if (compact) {
    return (
      <div
        className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900"
        role="status"
      >
        <p className="font-semibold">Entregado</p>
        {when ? <p className="text-[10px] text-emerald-800">{when}</p> : null}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 shadow-sm ${
        isCustomer ? "p-4" : "p-3"
      }`}
      role="status"
      aria-live="polite"
    >
      <p className={`font-semibold ${isCustomer ? "text-base" : "text-sm"}`}>{title}</p>
      <p className={`mt-1 text-emerald-900 ${isCustomer ? "text-sm" : "text-xs"}`}>{detail}</p>
      {when ? (
        <p className={`mt-2 font-medium text-emerald-800 ${isCustomer ? "text-xs" : "text-[11px]"}`}>
          Confirmado: {when}
        </p>
      ) : null}
    </div>
  );
}
