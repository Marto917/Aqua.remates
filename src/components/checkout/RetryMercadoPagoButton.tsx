"use client";

import { useState } from "react";

type Props = {
  orderId: string;
};

export function RetryMercadoPagoButton({ orderId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const res = await fetch(`/api/retail-orders/${orderId}/retry-mercadopago`, {
            method: "POST",
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            initPoint?: string;
          };
          setLoading(false);
          if (!res.ok || !data.initPoint) {
            setError(data.error ?? "No se pudo abrir Mercado Pago.");
            return;
          }
          window.location.href = data.initPoint;
        }}
        className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Abriendo Mercado Pago…" : "Reintentar pago (mismo pedido)"}
      </button>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
