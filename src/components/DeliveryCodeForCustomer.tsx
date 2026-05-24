type Props = {
  code: string;
  className?: string;
};

/** Código de entrega visible solo para el cliente (no va en el ticket impreso). */
export function DeliveryCodeForCustomer({ code, className = "" }: Props) {
  return (
    <div
      className={`rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
        Código para el repartidor
      </p>
      <p className="mt-1 text-2xl font-bold tracking-[0.35em] text-emerald-900">{code}</p>
      <p className="mt-1 text-xs text-emerald-800">
        Decile este código al repartidor cuando recibas el pedido para confirmar la entrega.
      </p>
    </div>
  );
}
