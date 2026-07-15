import Link from "next/link";
import { formatDisplayWords } from "@/lib/display-text";

type Cat = { name: string; slug: string };

export function CategoryStrip({ categories }: { categories: Cat[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="rounded-2xl border-2 border-brand/25 bg-white p-4 shadow-md sm:p-5">
      <div className="mb-3 text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">¿Qué estás buscando?</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Elegí una categoría</h2>
        <p className="mt-1 text-sm text-slate-600">Tocá una para ver solo esos productos</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5 sm:justify-start">
        <Link
          href="/catalog"
          className="inline-flex min-h-11 items-center rounded-full border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-brand hover:bg-brand/5 hover:text-brand-dark"
        >
          Ver todas
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/catalog?category=${encodeURIComponent(c.slug)}&priceMode=retail`}
            className="inline-flex min-h-11 items-center rounded-full border-2 border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand hover:bg-brand hover:text-white"
          >
            {formatDisplayWords(c.name)}
          </Link>
        ))}
      </div>
    </section>
  );
}
