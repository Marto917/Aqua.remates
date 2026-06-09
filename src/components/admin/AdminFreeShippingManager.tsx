"use client";

import { FormEvent, useState } from "react";
import type { FreeShippingCategoryMode, FreeShippingSettings } from "@/lib/free-shipping";

type Category = {
  id: string;
  name: string;
};

type Props = {
  initial: FreeShippingSettings;
  categories: Category[];
};

function activeSummary(settings: FreeShippingSettings, categories: Category[]) {
  if (!settings.enabled) return null;
  const parts: string[] = [];
  if (settings.minOrderEnabled && settings.minOrderAmount != null) {
    parts.push(`desde $${settings.minOrderAmount.toLocaleString("es-AR")}`);
  }
  if (settings.categoryFreeEnabled) {
    if (settings.categoryMode === "all") {
      parts.push("todas las categorías");
    } else {
      const names = new Map(categories.map((c) => [c.id, c.name]));
      const list = settings.categoryIds.map((id) => names.get(id) ?? "Categoría").join(", ");
      parts.push(list || "categorías seleccionadas");
    }
  }
  return parts.join(" · ");
}

export function AdminFreeShippingManager({ initial, categories }: Props) {
  const [settings, setSettings] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [minOrderEnabled, setMinOrderEnabled] = useState(initial.minOrderEnabled);
  const [minOrderAmount, setMinOrderAmount] = useState(
    initial.minOrderAmount != null ? String(initial.minOrderAmount) : "",
  );
  const [categoryFreeEnabled, setCategoryFreeEnabled] = useState(initial.categoryFreeEnabled);
  const [categoryMode, setCategoryMode] = useState<FreeShippingCategoryMode>(initial.categoryMode);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initial.categoryIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
    setOk(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);

    try {
      const res = await fetch("/api/admin/free-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          minOrderEnabled,
          minOrderAmount: minOrderAmount.trim() ? Number(minOrderAmount) : null,
          categoryFreeEnabled,
          categoryMode,
          categoryIds: categoryMode === "selected" ? selectedCategoryIds : [],
        }),
      });

      const raw = await res.text();
      let data: { error?: string; settings?: FreeShippingSettings } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.settings) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }

      setSettings(data.settings);
      setEnabled(data.settings.enabled);
      setMinOrderEnabled(data.settings.minOrderEnabled);
      setMinOrderAmount(
        data.settings.minOrderAmount != null ? String(data.settings.minOrderAmount) : "",
      );
      setCategoryFreeEnabled(data.settings.categoryFreeEnabled);
      setCategoryMode(data.settings.categoryMode);
      setSelectedCategoryIds(data.settings.categoryIds);
      setOk(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  const summary = activeSummary(settings, categories);

  return (
    <div className="space-y-4 rounded-2xl border border-sky-200/60 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Envío gratis</h2>
        <p className="mt-1 text-sm text-slate-600">
          Si está desactivado, el cliente paga el envío según su código postal. Activado, podés
          combinar monto mínimo y/o categorías (cualquiera de las reglas activas aplica).
        </p>
        <ul className="mt-2 text-xs text-slate-500">
          <li>Capital Federal: $6.000</li>
          <li>Provincia de Buenos Aires: $10.000</li>
          <li>Fuera de Buenos Aires: $20.000</li>
        </ul>
      </div>

      {settings.enabled && summary ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Envío gratis activo: {summary}
        </p>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Envío gratis desactivado (se cobra envío).
        </p>
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
          Activar promociones de envío gratis
        </label>

        <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4" disabled={!enabled}>
          <legend className="px-1 text-sm font-semibold text-slate-800">Reglas</legend>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={minOrderEnabled}
              onChange={(e) => {
                setMinOrderEnabled(e.target.checked);
                setOk(false);
              }}
            />
            Envío gratis si supera un monto
          </label>
          {minOrderEnabled ? (
            <label className="block max-w-xs text-sm text-slate-700">
              Monto mínimo (subtotal productos)
              <input
                type="number"
                min={1}
                value={minOrderAmount}
                onChange={(e) => {
                  setMinOrderAmount(e.target.value);
                  setOk(false);
                }}
                placeholder="50000"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={categoryFreeEnabled}
              onChange={(e) => {
                setCategoryFreeEnabled(e.target.checked);
                setOk(false);
              }}
            />
            Envío gratis por categoría
          </label>

          {categoryFreeEnabled ? (
            <div className="space-y-2 pl-1">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="free-ship-cat"
                  checked={categoryMode === "all"}
                  onChange={() => {
                    setCategoryMode("all");
                    setOk(false);
                  }}
                />
                Todas las categorías
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="free-ship-cat"
                  checked={categoryMode === "selected"}
                  onChange={() => {
                    setCategoryMode("selected");
                    setOk(false);
                  }}
                />
                Solo categorías elegidas
              </label>
              {categoryMode === "selected" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </fieldset>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {ok ? <p className="text-sm text-emerald-700">Guardado.</p> : null}

        <button
          type="submit"
          disabled={saving || (enabled && !minOrderEnabled && !categoryFreeEnabled)}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar envío gratis"}
        </button>
      </form>
    </div>
  );
}
