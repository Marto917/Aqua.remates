"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchAutocompleteInput } from "@/components/search/SearchAutocompleteInput";

type CategoryChip = { slug: string; name: string };

type Props = {
  categories: CategoryChip[];
  selectedCategory?: string;
  search?: string;
};

export function CatalogToolbarClient({ categories, selectedCategory, search }: Props) {
  const router = useRouter();

  function buildCatalogUrl(q?: string, category?: string) {
    const params = new URLSearchParams();
    if (q?.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <form
        action="/catalog"
        className="grid gap-2 sm:grid-cols-[1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = String(fd.get("q") ?? "");
          router.push(buildCatalogUrl(q, selectedCategory));
        }}
      >
        <SearchAutocompleteInput
          defaultValue={search ?? ""}
          placeholder="Buscar por nombre, código o categoría…"
          onSubmitNavigate={(term) => router.push(buildCatalogUrl(term, selectedCategory))}
        />
        {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
        <button className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white" type="submit">
          Buscar
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildCatalogUrl(search, undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !selectedCategory ? "bg-brand text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Todas
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={buildCatalogUrl(search, category.slug)}
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
  );
}
