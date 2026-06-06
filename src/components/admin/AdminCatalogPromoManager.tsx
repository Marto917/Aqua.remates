"use client";

import { FormEvent, useState } from "react";
import type { CatalogPromoMode, CatalogPromoSettings } from "@/lib/catalog-promo";

type Category = {
  id: string;
  name: string;
};

type Props = {
  initial: CatalogPromoSettings;
  categories: Category[];
};

function categoryPercentsToInputs(percents: Record<string, number>, categories: Category[]) {
  const out: Record<string, string> = {};
  for (const cat of categories) {
    out[cat.id] = percents[cat.id] != null ? String(percents[cat.id]) : "";
  }
  return out;
}

function parseCategoryPercents(inputs: Record<string, string>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(inputs)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const n = Number(trimmed);
    if (Number.isFinite(n) && n >= 1 && n <= 99) out[id] = Math.round(n);
  }
  return out;
}

function activeSummary(settings: CatalogPromoSettings, categories: Category[]) {
  if (!settings.enabled) return null;
  if (settings.mode === "global" && settings.globalPercent != null) {
    return `${settings.globalPercent}% en todo el catálogo.`;
  }
  const entries = Object.entries(settings.categoryPercents);
  if (entries.length === 0) return null;
  const names = new Map(categories.map((c) => [c.id, c.name]));
  return entries
    .map(([id, pct]) => `${names.get(id) ?? "Categoría"} ${pct}%`)
    .join(" · ");
}

export function AdminCatalogPromoManager({ initial, categories }: Props) {
  const [settings, setSettings] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [mode, setMode] = useState<CatalogPromoMode>(initial.mode);
  const [globalPercent, setGlobalPercent] = useState(
    initial.globalPercent != null ? String(initial.globalPercent) : "",
  );
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>(() =>
    categoryPercentsToInputs(initial.categoryPercents, categories),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function setCategoryPercent(id: string, value: string) {
    setCategoryInputs((prev) => ({ ...prev, [id]: value }));
    setOk(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);

    const categoryPercents = parseCategoryPercents(categoryInputs);

    try {
      const res = await fetch("/api/admin/catalog-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          mode,
          globalPercent: globalPercent.trim() ? Number(globalPercent) : null,
          categoryPercents,
        }),
      });

      const raw = await res.text();
      let data: { error?: string; settings?: CatalogPromoSettings } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.settings) {
        setError(
          data.error ??
            (res.status === 500
              ? "Error del servidor. ¿Corriste la migración de base de datos (npm run db:migrate)?"
              : "No se pudo guardar."),
        );
        return;
      }

      setSettings(data.settings);
      setEnabled(data.settings.enabled);
      setMode(data.settings.mode);
      setGlobalPercent(
        data.settings.globalPercent != null ? String(data.settings.globalPercent) : "",
      );
      setCategoryInputs(categoryPercentsToInputs(data.settings.categoryPercents, categories));
      setOk(true);
    } catch {
      setError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const summary = activeSummary(settings, categories);
  const hasByCategoryValues = Object.keys(parseCategoryPercents(categoryInputs)).length > 0;
  const canSave =
    !enabled ||
    (mode === "global" && globalPercent.trim() !== "") ||
    (mode === "byCategory" && hasByCategoryValues);

  return (
    <div className="space-y-4 rounded-2xl border border-rose-200/60 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Promo en catálogo (círculo y precio)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Un solo % por promo: el mismo valor aparece en el círculo y se aplica al precio transferencia.
          Podés usar un descuento para todo el catálogo o distintos % por categoría.
        </p>
      </div>

      {settings.enabled && summary ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Promo activa: {summary}</p>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Promo desactivada.</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              setOk(false);
            }}
          />
          Activar promo en el catálogo
        </label>

        <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4" disabled={!enabled}>
          <legend className="px-1 text-sm font-semibold text-slate-800">Tipo de descuento</legend>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="promo-mode"
              checked={mode === "global"}
              onChange={() => {
                setMode("global");
                setOk(false);
              }}
            />
            Mismo % para todo el catálogo
          </label>

          {mode === "global" ? (
            <label className="block max-w-xs text-sm text-slate-700">
              % de descuento
              <input
                type="number"
                min={1}
                max={99}
                value={globalPercent}
                onChange={(e) => {
                  setGlobalPercent(e.target.value);
                  setOk(false);
                }}
                placeholder="15"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="promo-mode"
              checked={mode === "byCategory"}
              onChange={() => {
                setMode("byCategory");
                setOk(false);
              }}
            />
            Distinto % por categoría
          </label>

          {mode === "byCategory" ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Dejá vacío el % en categorías sin promo. Solo las que tengan valor mostrarán círculo y precio
                tachado.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={categoryInputs[cat.id] ?? ""}
                      onChange={(e) => setCategoryPercent(cat.id, e.target.value)}
                      placeholder="%"
                      className="w-20 shrink-0 rounded-md border px-2 py-1.5 text-right"
                    />
                  </label>
                ))}
              </div>
              {!hasByCategoryValues ? (
                <p className="text-xs text-amber-700">Completá el % en al menos una categoría.</p>
              ) : null}
            </div>
          ) : null}
        </fieldset>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {ok ? <p className="text-sm text-emerald-700">Guardado. Refrescá la tienda para ver los cambios.</p> : null}

        <button
          type="submit"
          disabled={saving || !canSave}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar promo de catálogo"}
        </button>
      </form>
    </div>
  );
}
