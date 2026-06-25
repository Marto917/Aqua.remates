"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SearchAutocompleteInput } from "@/components/search/SearchAutocompleteInput";

type CategoryChip = { slug: string; name: string };

type Props = {
  categories: CategoryChip[];
  selectedCategory?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
};

export function CatalogToolbarClient({
  categories,
  selectedCategory,
  search,
  minPrice,
  maxPrice,
}: Props) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice ?? "");
  const [localMax, setLocalMax] = useState(maxPrice ?? "");

  function buildCatalogUrl(opts?: {
    q?: string;
    category?: string;
    min?: string;
    max?: string;
  }) {
    const params = new URLSearchParams();
    const q = opts?.q ?? search;
    const category = opts?.category ?? selectedCategory;
    const min = opts?.min ?? localMin;
    const max = opts?.max ?? localMax;

    if (q?.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (min?.trim()) params.set("minPrice", min.trim());
    if (max?.trim()) params.set("maxPrice", max.trim());

    const qs = params.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  }

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    router.push(buildCatalogUrl());
    setFiltersOpen(false);
  }

  function clearFilters() {
    setLocalMin("");
    setLocalMax("");
    router.push(buildCatalogUrl({ category: undefined, min: "", max: "" }));
    setFiltersOpen(false);
  }

  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <form
        action="/catalog"
        className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = String(fd.get("q") ?? "");
          router.push(buildCatalogUrl({ q }));
        }}
      >
        <SearchAutocompleteInput
          defaultValue={search ?? ""}
          placeholder="Buscar por nombre, código o categoría…"
          onSubmitNavigate={(term) => router.push(buildCatalogUrl({ q: term }))}
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            filtersOpen || activeFilterCount > 0
              ? "border-brand bg-brand-muted text-brand-dark"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white" type="submit">
          Buscar
        </button>
      </form>

      {filtersOpen ? (
        <form onSubmit={applyFilters} className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Categoría</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildCatalogUrl({ category: undefined })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !selectedCategory ? "bg-brand text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                Todas
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={buildCatalogUrl({ category: category.slug })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    selectedCategory === category.slug
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rango de precio (lista)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                step="1"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                placeholder="Mínimo"
                className="w-32 rounded-md border px-3 py-2 text-sm"
              />
              <span className="text-slate-400">—</span>
              <input
                type="number"
                min={0}
                step="1"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                placeholder="Máximo"
                className="w-32 rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Limpiar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
