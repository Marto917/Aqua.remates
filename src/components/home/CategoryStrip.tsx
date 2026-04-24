import Link from "next/link";

type Cat = { name: string; slug: string };

export function CategoryStrip({ categories }: { categories: Cat[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-gradient-to-br from-white to-brand-muted/30 p-1 shadow-sm">
      <div className="rounded-xl bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-5 sm:py-5">
        <h2 className="mb-3 flex items-center gap-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <span className="h-1 w-1 rounded-full bg-brand" aria-hidden />
          Comprá por categoría
        </h2>
        <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/catalog?category=${encodeURIComponent(c.slug)}&priceMode=retail`}
              className="shrink-0 rounded-full border border-slate-200/90 bg-slate-50/90 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/60 hover:bg-white hover:shadow-md hover:shadow-brand/5"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
