import Link from "next/link";
import type { PriceMode } from "@/lib/catalog";

type CatalogToolbarProps = {
  categories: { id: string; name: string; slug: string }[];
  selectedCategory?: string;
  search?: string;
  priceMode: PriceMode;
};

export function CatalogToolbar({
  categories,
  selectedCategory,
  search,
  priceMode,
}: CatalogToolbarProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <form action="/catalog" className="flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Buscar productos..."
          className="w-full rounded-md border px-3 py-2"
        />
        <input type="hidden" name="priceMode" value={priceMode} />
        {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
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
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/catalog?category=${category.slug}&priceMode=${priceMode}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              selectedCategory === category.slug ? "bg-brand text-white" : ""
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
