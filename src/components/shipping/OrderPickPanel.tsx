"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatArs } from "@/lib/currency";
import { retailShippingMethodLabel } from "@/lib/order-labels";
import type { RetailShippingMethod } from "@prisma/client";

export type PickLine = {
  id: string;
  productName: string;
  variantColorLabel: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type Props = {
  orderId: string;
  buyerName: string;
  shippingMethod: RetailShippingMethod;
  shippingAddress: string | null;
  notes: string | null;
  items: PickLine[];
  alreadyPacked: boolean;
  packedAtLabel: string | null;
};

export function OrderPickPanel({
  orderId,
  buyerName,
  shippingMethod,
  shippingAddress,
  notes,
  items,
  alreadyPacked,
  packedAtLabel,
}: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = useMemo(() => {
    if (items.length === 0) return true;
    return items.every((line) => checked[line.id]);
  }, [items, checked]);

  async function confirmPacked() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/pack`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo confirmar el armado.");
        return;
      }
      router.refresh();
      router.push("/vendedor/envios");
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  if (alreadyPacked) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Pedido armado</p>
          {packedAtLabel ? <p className="mt-1">{packedAtLabel}</p> : null}
          <p className="mt-2 text-emerald-800">
            Se envió un correo al cliente con el aviso correspondiente.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/vendedor/envios/minorista/${orderId}/ticket`}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Ver ticket / imprimir
          </Link>
          <Link
            href="/vendedor/envios"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
          >
            Volver a envíos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">{buyerName}</p>
        <p className="mt-1 text-slate-600">{retailShippingMethodLabel[shippingMethod]}</p>
        {shippingAddress ? <p className="mt-1 text-slate-600">{shippingAddress}</p> : null}
        {notes ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
            <span className="font-medium">Notas: </span>
            {notes}
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Productos a preparar</h2>
        <p className="mt-1 text-sm text-slate-600">
          Marcá cada ítem cuando lo tengas en el bulto. Al terminar, confirmá el armado.
        </p>
        <ul className="mt-4 space-y-3">
          {items.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
              Este pedido no tiene líneas de producto (solo monto total). Podés confirmar el armado igualmente.
            </li>
          ) : (
            items.map((line) => (
              <li
                key={line.id}
                className={`flex gap-4 rounded-2xl border-2 p-4 transition ${
                  checked[line.id]
                    ? "border-emerald-300 bg-emerald-50/80"
                    : "border-slate-200 bg-white"
                }`}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    className="mt-1.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand focus:ring-brand"
                    checked={!!checked[line.id]}
                    onChange={(e) =>
                      setChecked((prev) => ({ ...prev, [line.id]: e.target.checked }))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-slate-900">{line.productName}</p>
                    {line.variantColorLabel ? (
                      <p className="text-sm font-medium text-violet-700">Color: {line.variantColorLabel}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-slate-500">
                      Precio unitario {formatArs(line.unitPrice)}
                    </p>
                  </div>
                  <div className="shrink-0 text-center">
                    <span className="inline-flex h-14 min-w-[3.5rem] items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
                      {line.quantity}
                    </span>
                    <p className="mt-1 text-xs font-medium text-slate-500">unidades</p>
                  </div>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          disabled={!allChecked || saving}
          onClick={() => void confirmPacked()}
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Confirmar pedido armado"}
        </button>
        <Link href="/vendedor/envios" className="text-sm text-slate-600 underline">
          Cancelar
        </Link>
        {!allChecked && items.length > 0 ? (
          <p className="w-full text-xs text-slate-500">Marcá todos los productos para habilitar la confirmación.</p>
        ) : null}
      </div>
    </div>
  );
}
