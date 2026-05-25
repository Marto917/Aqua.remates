"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

type ProductFiltersProps = {
  categories: { id: string; name: string; slug: string }[];
};

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

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
            Buscador
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Nombre, código o categoría"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </form>

        <div className="w-full md:max-w-xs">
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Categoría
          </label>
          <select
            id="category"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={category}
            onChange={(event) => updateParam("category", event.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
