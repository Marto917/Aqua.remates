"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { buildCatalogHref } from "@/lib/catalog";
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
  const [priceOpen, setPriceOpen] = useState(Boolean(minPrice || maxPrice));
  const [localMin, setLocalMin] = useState(minPrice ?? "");
  const [localMax, setLocalMax] = useState(maxPrice ?? "");

  function buildCatalogUrl(opts?: {
    q?: string;
    category?: string;
    min?: string;
    max?: string;
  }) {
    return buildCatalogHref({
      q: opts?.q ?? search,
      category: opts?.category ?? selectedCategory,
      minPrice: opts?.min ?? localMin,
      maxPrice: opts?.max ?? localMax,
    });
  }

  function applyPrice(e: FormEvent) {
    e.preventDefault();
    router.push(buildCatalogUrl());
  }

  function clearPrice() {
    setLocalMin("");
    setLocalMax("");
    router.push(buildCatalogUrl({ min: "", max: "" }));
  }

  return (
    <div className="space-y-4">
      <form
        action="/catalog"
        className="grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_auto]"
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
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white" type="submit">
          Buscar
        </button>
      </form>

      <section className="rounded-xl border-2 border-brand/30 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">Paso 1</p>
          <h2 className="text-lg font-bold text-slate-900">Elegí una categoría</h2>
          <p className="text-sm text-slate-600">Así encontrás más rápido lo que necesitás</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildCatalogUrl({ category: undefined })}
            className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              !selectedCategory
                ? "bg-brand text-white shadow"
                : "border-2 border-slate-200 bg-slate-50 text-slate-800 hover:border-brand"
            }`}
          >
            Todas
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={buildCatalogUrl({ category: category.slug })}
              className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === category.slug
                  ? "bg-brand text-white shadow"
                  : "border-2 border-brand/25 bg-brand/5 text-brand-dark hover:border-brand hover:bg-brand hover:text-white"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-xl border bg-white p-4">
        <button
          type="button"
          onClick={() => setPriceOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
        >
          <span>Filtrar por precio {minPrice || maxPrice ? "(activo)" : ""}</span>
          <span className="text-slate-400">{priceOpen ? "▲" : "▼"}</span>
        </button>
        {priceOpen ? (
          <form onSubmit={applyPrice} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
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
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
                Aplicar precio
              </button>
              <button
                type="button"
                onClick={clearPrice}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Limpiar
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
