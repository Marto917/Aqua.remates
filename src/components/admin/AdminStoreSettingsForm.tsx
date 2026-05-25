"use client";

import { FormEvent, useState } from "react";
import type { StoreSettingsData } from "@/lib/store-settings";

export function AdminStoreSettingsForm({ initial }: { initial: StoreSettingsData }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar.");
      return;
    }
    setOk(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-5">
      <h2 className="font-semibold text-slate-900">Transferencia bancaria</h2>
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Titular"
        value={form.bankHolder}
        onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
        required
      />
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Alias"
        value={form.bankAlias}
        onChange={(e) => setForm({ ...form, bankAlias: e.target.value })}
        required
      />
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="CBU"
        value={form.bankCbu}
        onChange={(e) => setForm({ ...form, bankCbu: e.target.value })}
        required
      />
      <textarea
        className="w-full rounded-md border px-3 py-2"
        placeholder="Notas extra (opcional)"
        rows={2}
        value={form.bankExtraNotes ?? ""}
        onChange={(e) => setForm({ ...form, bankExtraNotes: e.target.value })}
      />

      <h2 className="font-semibold text-slate-900">Precios</h2>
      <label className="block text-sm">
        Descuento transferencia sobre lista (%)
        <input
          type="number"
          min={0}
          max={90}
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={form.transferDiscountPercent}
          onChange={(e) =>
            setForm({ ...form, transferDiscountPercent: Number(e.target.value) })
          }
        />
      </label>
      <label className="block text-sm">
        Recargo Mercado Pago sobre precio transferencia (%)
        <input
          type="number"
          min={0}
          max={100}
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={form.mercadoPagoMarkupPercent}
          onChange={(e) =>
            setForm({ ...form, mercadoPagoMarkupPercent: Number(e.target.value) })
          }
        />
      </label>
      <label className="block text-sm">
        Texto del badge (sin números)
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={form.discountBadgeLabel}
          onChange={(e) => setForm({ ...form, discountBadgeLabel: e.target.value })}
          required
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Guardado correctamente.</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
