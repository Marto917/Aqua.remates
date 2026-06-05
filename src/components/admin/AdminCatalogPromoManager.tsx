"use client";

import { FormEvent, useState } from "react";
import type { CatalogPromoSettings } from "@/lib/catalog-promo";

type Category = {
  id: string;
  name: string;
};

type Props = {
  initial: CatalogPromoSettings;
  categories: Category[];
};

export function AdminCatalogPromoManager({ initial, categories }: Props) {
  const [settings, setSettings] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [badgePercent, setBadgePercent] = useState(
    initial.badgePercent != null ? String(initial.badgePercent) : "",
  );
  const [discountPercent, setDiscountPercent] = useState(
    initial.discountPercent != null ? String(initial.discountPercent) : "",
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initial.categoryIds);
  const [allCategories, setAllCategories] = useState(initial.categoryIds.length === 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function toggleCategory(id: string) {
    setAllCategories(false);
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

    const res = await fetch("/api/admin/catalog-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        badgePercent: badgePercent ? Number(badgePercent) : null,
        discountPercent: discountPercent ? Number(discountPercent) : null,
        categoryIds: allCategories ? [] : selectedCategoryIds,
      }),
    });
    const data = (await res.json()) as { error?: string; settings?: CatalogPromoSettings };
    setSaving(false);
    if (!res.ok || !data.settings) {
      setError(data.error ?? "No se pudo guardar.");
      return;
    }
    setSettings(data.settings);
    setEnabled(data.settings.enabled);
    setBadgePercent(data.settings.badgePercent != null ? String(data.settings.badgePercent) : "");
    setDiscountPercent(
      data.settings.discountPercent != null ? String(data.settings.discountPercent) : "",
    );
    setSelectedCategoryIds(data.settings.categoryIds);
    setAllCategories(data.settings.categoryIds.length === 0);
    setOk(true);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-rose-200/60 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Promo en catálogo (círculo y precio)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Aplica a los productos del catálogo: círculo con % de descuento y precio transferencia tachado
          con el valor promo. Podés limitar por categoría (ej. solo electrodomésticos) o dejar todas
          marcadas para que aplique a todo.
        </p>
      </div>

      {settings.enabled ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Promo activa
          {settings.categoryIds.length > 0
            ? ` en ${settings.categoryIds.length} categoría(s).`
            : " en todas las categorías."}
        </p>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            % en el círculo (ej. 20)
            <input
              type="number"
              min={1}
              max={99}
              value={badgePercent}
              onChange={(e) => setBadgePercent(e.target.value)}
              placeholder="20"
              className="mt-1 w-full rounded-md border px-3 py-2"
              disabled={!enabled}
            />
          </label>
          <label className="text-sm text-slate-700">
            % descuento sobre precio transferencia
            <input
              type="number"
              min={1}
              max={90}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="15"
              className="mt-1 w-full rounded-md border px-3 py-2"
              disabled={!enabled}
            />
          </label>
        </div>

        <fieldset className="space-y-2 rounded-xl border border-slate-200 p-4" disabled={!enabled}>
          <legend className="px-1 text-sm font-semibold text-slate-800">Categorías</legend>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allCategories}
              onChange={(e) => {
                setAllCategories(e.target.checked);
                if (e.target.checked) setSelectedCategoryIds([]);
                setOk(false);
              }}
            />
            Todas las categorías
          </label>
          {!allCategories ? (
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
          {!allCategories && selectedCategoryIds.length === 0 ? (
            <p className="text-xs text-amber-700">
              Elegí al menos una categoría o marcá &quot;Todas las categorías&quot;.
            </p>
          ) : null}
        </fieldset>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {ok ? <p className="text-sm text-emerald-700">Guardado. Refrescá la tienda para ver los cambios.</p> : null}

        <button
          type="submit"
          disabled={saving || (!allCategories && enabled && selectedCategoryIds.length === 0)}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar promo de catálogo"}
        </button>
      </form>
    </div>
  );
}
