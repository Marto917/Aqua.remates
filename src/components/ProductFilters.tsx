"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";
import { FIXED_CATEGORIES } from "@/lib/categories";

type ProductFiltersProps = {
  categories?: { id: string; name: string; slug: string }[];
};

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const mode = searchParams.get("mode") === "wholesale" ? "wholesale" : "retail";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/catalog?${params.toString()}`);
  };

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateParam("q", String(data.get("q") ?? ""));
  };

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <form onSubmit={onSearch} className="w-full md:max-w-sm">
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            Buscador global
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o SKU"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </form>

        <div className="w-full md:max-w-xs">
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Categoria
          </label>
          <select
            id="category"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={category}
            onChange={(event) => updateParam("category", event.target.value)}
          >
            <option value="">Todas</option>
            {(categories?.length ? categories : FIXED_CATEGORIES).map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:max-w-xs">
          <span className="mb-1 block text-sm font-medium">Modo de precio</span>
          <div className="inline-flex rounded-lg border p-1">
            <button
              type="button"
              onClick={() => updateParam("mode", "retail")}
              className={`rounded-md px-3 py-2 text-sm ${
                mode === "retail" ? "bg-brand-700 text-white" : "text-slate-600"
              }`}
            >
              Minorista
            </button>
            <button
              type="button"
              onClick={() => updateParam("mode", "wholesale")}
              className={`rounded-md px-3 py-2 text-sm ${
                mode === "wholesale" ? "bg-brand-700 text-white" : "text-slate-600"
              }`}
            >
              Mayorista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
