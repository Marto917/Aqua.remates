import Link from "next/link";

type Cat = { name: string; slug: string };

export function CategoryStrip({ categories }: { categories: Cat[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Comprá por categoría
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/catalog?category=${encodeURIComponent(c.slug)}&priceMode=retail`}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-brand hover:bg-brand-muted hover:text-brand-dark"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
