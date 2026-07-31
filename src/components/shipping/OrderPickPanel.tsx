"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BarcodePickScanner } from "@/components/shipping/BarcodePickScanner";
import { formatArs } from "@/lib/currency";
import { colorLabelToDisplayName } from "@/lib/color-display";
import { barcodesMatch, normalizeBarcode } from "@/lib/product-barcodes";
import { retailShippingMethodLabel } from "@/lib/order-labels";
import { resolveProductImageUrl } from "@/lib/product-images";
import type { RetailShippingMethod } from "@prisma/client";

export type PickLine = {
  id: string;
  productName: string;
  variantColorLabel: string | null;
  colorDisplayName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string;
  /** Todos los códigos del producto (principal + extras). */
  barcodes: string[];
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
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aDone = (picked[a.id] ?? 0) >= a.quantity;
      const bDone = (picked[b.id] ?? 0) >= b.quantity;
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  }, [items, picked]);

  const allPicked = useMemo(() => {
    if (items.length === 0) return true;
    return items.every((line) => (picked[line.id] ?? 0) >= line.quantity);
  }, [items, picked]);

  function bumpPicked(lineId: string, delta: number) {
    const line = items.find((l) => l.id === lineId);
    if (!line) return;
    setPicked((prev) => {
      const next = Math.max(0, Math.min(line.quantity, (prev[lineId] ?? 0) + delta));
      return { ...prev, [lineId]: next };
    });
  }

  function handleScan(raw: string) {
    const code = normalizeBarcode(raw);
    if (!code) return;

    const match = items.find((line) =>
      line.barcodes.some((b) => barcodesMatch(b, code)),
    );

    if (!match) {
      setScanMsg(`Código ${raw} no coincide con ningún producto del pedido.`);
      return;
    }

    const current = picked[match.id] ?? 0;
    if (current >= match.quantity) {
      setScanMsg(`Ya colectaste todas las unidades de ${match.productName}.`);
      return;
    }

    bumpPicked(match.id, 1);
    setScanMsg(`✓ ${match.productName} (${current + 1}/${match.quantity})`);
  }

  async function confirmPacked() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/pack`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo confirmar el armado.");
        setSaving(false);
        return;
      }
      // Soft nav deja la lista de envíos en cache; forzamos recarga fresca.
      window.location.assign("/vendedor/envios");
    } catch {
      setError("Error de conexión.");
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
            onClick={(e) => {
              e.preventDefault();
              window.location.assign("/vendedor/envios");
            }}
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

      {items.length > 0 ? <BarcodePickScanner onScan={handleScan} disabled={saving} /> : null}
      {scanMsg ? <p className="text-sm text-slate-700">{scanMsg}</p> : null}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Productos a preparar</h2>
        <p className="mt-1 text-sm text-slate-600">
          Colectá cada ítem (manual o escaneando). Los completados pasan abajo en verde.
        </p>
        <ul className="mt-4 space-y-3">
          {items.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
              Este pedido no tiene líneas de producto. Podés confirmar el armado igualmente.
            </li>
          ) : (
            sortedItems.map((line) => {
              const count = picked[line.id] ?? 0;
              const done = count >= line.quantity;
              return (
                <li
                  key={line.id}
                  className={`flex gap-4 rounded-2xl border-2 p-4 transition ${
                    done ? "border-emerald-300 bg-emerald-50/80" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image
                      src={resolveProductImageUrl(line.imageUrl)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900">{line.productName}</p>
                    <p className="text-sm text-violet-700">
                      Color: {line.colorDisplayName || colorLabelToDisplayName(line.variantColorLabel)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-600">
                      Código:{" "}
                      {line.barcodes.length > 0
                        ? line.barcodes.join(" · ")
                        : "— sin código —"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Precio unitario {formatArs(line.unitPrice)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bumpPicked(line.id, -1)}
                        disabled={count <= 0}
                        className="h-9 w-9 rounded-full border border-slate-300 text-lg font-bold disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="min-w-[4rem] text-center text-sm font-semibold">
                        {count} / {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => bumpPicked(line.id, 1)}
                        disabled={count >= line.quantity}
                        className="h-9 w-9 rounded-full border border-brand bg-brand-muted text-lg font-bold text-brand-dark disabled:opacity-40"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-500">colectadas</span>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          disabled={!allPicked || saving}
          onClick={() => void confirmPacked()}
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Confirmar pedido armado"}
        </button>
        <Link
          href="/vendedor/envios"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Cancelar
        </Link>
        {!allPicked && items.length > 0 ? (
          <p className="w-full text-xs text-slate-500">
            Colectá todas las unidades de cada producto para habilitar la confirmación.
          </p>
        ) : null}
      </div>
    </div>
  );
}
