"use client";

import { FormEvent, useState } from "react";
import type { ShippingRates } from "@/lib/shipping-zones";
import { SHIPPING_ZONE_LABELS } from "@/lib/shipping-zones";

type Props = {
  initial: ShippingRates;
};

export function AdminShippingRatesForm({ initial }: Props) {
  const [caba, setCaba] = useState(String(initial.CABA));
  const [pba, setPba] = useState(String(initial.PBA));
  const [outside, setOutside] = useState(String(initial.OUTSIDE));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    const res = await fetch("/api/admin/shipping-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingRateCaba: Number(caba),
        shippingRatePba: Number(pba),
        shippingRateOutside: Number(outside),
      }),
    });
    const data = (await res.json()) as { error?: string; rates?: ShippingRates };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar.");
      return;
    }
    if (data.rates) {
      setCaba(String(data.rates.CABA));
      setPba(String(data.rates.PBA));
      setOutside(String(data.rates.OUTSIDE));
    }
    setOk(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Costos de envío a domicilio</h2>
        <p className="mt-1 text-sm text-slate-600">
          Montos en pesos que se cobran según la zona del código postal (sin envío gratis).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="font-medium text-slate-700">{SHIPPING_ZONE_LABELS.CABA}</span>
          <input
            type="number"
            min={0}
            step={100}
            required
            value={caba}
            onChange={(e) => setCaba(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">{SHIPPING_ZONE_LABELS.PBA}</span>
          <input
            type="number"
            min={0}
            step={100}
            required
            value={pba}
            onChange={(e) => setPba(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">{SHIPPING_ZONE_LABELS.OUTSIDE}</span>
          <input
            type="number"
            min={0}
            step={100}
            required
            value={outside}
            onChange={(e) => setOutside(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Tarifas guardadas.</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar costos de envío"}
      </button>
    </form>
  );
}
