"use client";

import { FormEvent, useState } from "react";
import type { StoreSettingsData } from "@/lib/store-settings";

type Props = {
  initial: StoreSettingsData;
  /** Dueño o encargado: pueden editar datos bancarios. */
  canEditBank: boolean;
};

export function AdminStoreSettingsForm({ initial, canEditBank }: Props) {
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
      body: JSON.stringify({
        ...form,
        ...(canEditBank
          ? {}
          : {
              bankHolder: initial.bankHolder,
              bankAlias: initial.bankAlias,
              bankCbu: initial.bankCbu,
              bankExtraNotes: initial.bankExtraNotes,
            }),
      }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar.");
      return;
    }
    setOk(true);
  }

  const bankFieldClass = canEditBank
    ? "w-full rounded-md border px-3 py-2"
    : "w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4 rounded-xl border bg-white p-5">
        <div>
          <h2 className="font-semibold text-slate-900">Transferencia bancaria</h2>
          {!canEditBank ? (
            <p className="mt-1 text-sm text-amber-800">
              Solo el encargado o el dueño puede editar CVU, razón social y alias. Podés verlos, pero no
              modificarlos.
            </p>
          ) : null}
        </div>
        <input
          className={bankFieldClass}
          placeholder="Titular / razón social"
          value={form.bankHolder}
          onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
          required
          readOnly={!canEditBank}
          disabled={!canEditBank}
        />
        <input
          className={bankFieldClass}
          placeholder="Alias"
          value={form.bankAlias}
          onChange={(e) => setForm({ ...form, bankAlias: e.target.value })}
          required
          readOnly={!canEditBank}
          disabled={!canEditBank}
        />
        <input
          className={bankFieldClass}
          placeholder="CBU / CVU"
          value={form.bankCbu}
          onChange={(e) => setForm({ ...form, bankCbu: e.target.value })}
          required
          readOnly={!canEditBank}
          disabled={!canEditBank}
        />
        <textarea
          className={bankFieldClass}
          placeholder="Notas extra (opcional)"
          rows={2}
          value={form.bankExtraNotes ?? ""}
          onChange={(e) => setForm({ ...form, bankExtraNotes: e.target.value })}
          readOnly={!canEditBank}
          disabled={!canEditBank}
        />
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Los precios de lista y transferencia se cargan en cada producto del catálogo.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-slate-900">Colores de la tienda pública</h2>
        <p className="text-sm text-slate-600">
          Personalizá la paleta para campañas (Navidad, etc.). Formato{" "}
          <code className="rounded bg-slate-100 px-1">#RRGGBB</code> o dejá vacío para el tema AQUA.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["Principal (botones)", "themeBrandPrimary", "#14b8a8"],
              ["Oscuro (textos)", "themeBrandDark", "#0f766e"],
              ["Fondo suave", "themeBrandMuted", "#f0fdfa"],
            ] as const
          ).map(([label, key, fallback]) => (
            <label key={key} className="text-sm">
              <span className="font-medium text-slate-700">{label}</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={form[key] ?? fallback}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border"
                />
                <input
                  value={form[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value || null })}
                  placeholder={fallback}
                  className="flex-1 rounded-md border px-2 py-2 font-mono text-xs"
                />
              </div>
            </label>
          ))}
        </div>
      </section>

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
