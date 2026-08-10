"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRetailOrderAsOwner } from "@/app/(staff)/admin/pedidos/actions";

type Props = {
  orderId: string;
  /** Si true, tras borrar vuelve a la lista. */
  redirectToList?: boolean;
  compact?: boolean;
};

export function StaffDeleteOrderButton({
  orderId,
  redirectToList = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    if (
      !window.confirm(
        "¿Borrar este pedido de forma permanente? No se puede deshacer.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteRetailOrderAsOwner(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (redirectToList) {
        router.push("/admin/pedidos");
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={
          compact
            ? "text-xs font-medium text-rose-700 underline-offset-2 hover:underline disabled:opacity-50"
            : "inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
        }
      >
        {pending ? "Borrando…" : "Borrar"}
      </button>
      {error ? <span className="text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}
