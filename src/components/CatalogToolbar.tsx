import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDisplayWords } from "@/lib/display-text";

type CatalogToolbarProps = {
  selectedCategory?: string;
  search?: string;
};

export async function CatalogToolbar({ selectedCategory, search }: CatalogToolbarProps) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <form action="/catalog" className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          name="q"
          defaultValue={search}
          placeholder="Buscar por nombre, código o categoría…"
          className="w-full rounded-md border px-3 py-2"
        />
        <select
          name="category"
          defaultValue={selectedCategory ?? ""}
          className="rounded-md border px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {formatDisplayWords(category.name)}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-brand px-4 py-2 text-white sm:col-span-2" type="submit">
          Buscar
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/catalog"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !selectedCategory ? "bg-brand text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Todas
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/catalog?category=${category.slug}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedCategory === category.slug
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {formatDisplayWords(category.name)}
          </Link>
        ))}
      </div>
    </div>
  );
}
