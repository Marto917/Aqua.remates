import Link from "next/link";
import type { PriceMode } from "@/lib/catalog";
import { FIXED_CATEGORIES } from "@/lib/categories";
import { formatDisplayWords } from "@/lib/display-text";

type CatalogToolbarProps = {
  selectedCategory?: string;
  search?: string;
  priceMode: PriceMode;
};

export function CatalogToolbar({
  selectedCategory,
  search,
  priceMode,
}: CatalogToolbarProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <form action="/catalog" className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          name="q"
          defaultValue={search}
          placeholder="Buscar productos..."
          className="w-full rounded-md border px-3 py-2"
        />
        <select
          name="category"
          defaultValue={selectedCategory ?? ""}
          className="rounded-md border px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todas las categorías</option>
          {FIXED_CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {formatDisplayWords(category.name)}
            </option>
          ))}
        </select>
        <input type="hidden" name="priceMode" value={priceMode} />
        <button className="rounded-md bg-brand px-4 py-2 text-white" type="submit">
          Buscar
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/catalog?priceMode=${priceMode}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          className={`rounded-full border px-3 py-1 text-sm ${!selectedCategory ? "bg-brand text-white" : ""}`}
        >
          Todas
        </Link>
        {FIXED_CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/catalog?category=${category.slug}&priceMode=${priceMode}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              selectedCategory === category.slug ? "bg-brand text-white" : ""
            }`}
          >
            {formatDisplayWords(category.name)}
          </Link>
        ))}
      </div>
    </div>
  );
}
