"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    if (
      !window.confirm(
        "¿Enviar este pedido a la papelera? Podés restaurarlo hasta 15 días.",
      )
    ) {
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      let data: { ok?: boolean; error?: string } = {};
      try {
        data = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        data = {};
      }

      if (!res.ok || !data.ok) {
        setError(data.error || `No se pudo borrar (HTTP ${res.status}).`);
        return;
      }

      if (redirectToList) {
        router.push("/admin/pedidos");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red al borrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={pending}
        className={
          compact
            ? "text-xs font-medium text-rose-700 underline-offset-2 hover:underline disabled:opacity-50"
            : "inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
        }
      >
        {pending ? "Borrando…" : "Borrar"}
      </button>
      {error ? <span className="max-w-[14rem] text-left text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}
