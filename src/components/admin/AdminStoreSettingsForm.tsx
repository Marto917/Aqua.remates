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
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar.");
      return;
    }
    setOk(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4 rounded-xl border bg-white p-5">
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
