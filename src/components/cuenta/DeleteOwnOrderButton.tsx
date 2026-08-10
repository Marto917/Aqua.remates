"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteAllOwnRetailOrders,
  deleteOwnRetailOrder,
} from "@/app/(tienda)/cuenta/mis-compras/actions";

type OneProps = {
  orderId: string;
};

export function DeleteOwnOrderButton({ orderId }: OneProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    if (
      !window.confirm(
        "¿Borrar esta compra de forma permanente? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteOwnRetailOrder(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
      >
        {pending ? "Borrando…" : "Borrar compra"}
      </button>
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}

type AllProps = {
  orderCount: number;
};

export function DeleteAllOwnOrdersButton({ orderCount }: AllProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (orderCount <= 0) return null;

  function onClick() {
    setError(null);
    if (
      !window.confirm(
        `¿Borrar las ${orderCount} compra(s) de tu cuenta? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAllOwnRetailOrders();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
      <p className="text-sm text-rose-900">
        Herramienta solo para tu cuenta: podés borrar compras de prueba.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="mt-2 inline-flex rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
      >
        {pending ? "Borrando…" : "Borrar todas mis compras"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
