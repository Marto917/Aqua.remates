"use client";

import { useState, useTransition } from "react";
import { markPickupDeliveredAction } from "@/app/(staff)/vendedor/envios/actions";

type Props = {
  orderId: string;
};

export function PickupDeliverButton({ orderId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markPickupDeliveredAction(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return <span className="text-xs font-medium text-emerald-700">Entregado ✓</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "…" : "Marcar entregado"}
      </button>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
