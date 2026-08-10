"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
};

export function TrashRestoreButton({ orderId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/restore`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `No se pudo restaurar (HTTP ${res.status}).`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red.");
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
        className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline disabled:opacity-50"
      >
        {pending ? "Restaurando…" : "Restaurar"}
      </button>
      {error ? <span className="max-w-[12rem] text-left text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}

export function TrashPurgeButton({ orderId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    if (
      !window.confirm(
        "¿Borrar este pedido para siempre? No se puede deshacer.",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/purge`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `No se pudo borrar (HTTP ${res.status}).`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red.");
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
        className="text-xs font-semibold text-rose-700 underline-offset-2 hover:underline disabled:opacity-50"
      >
        {pending ? "Borrando…" : "Borrar ya"}
      </button>
      {error ? <span className="max-w-[12rem] text-left text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}
