"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM20 20l-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  sku?: string | null;
  category?: string;
};

export function HomeHeroSearch() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { items?: Suggestion[] };
        const items = data.items ?? [];
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  return (
    <form action="/catalog" className="relative mx-auto max-w-2xl">
      <label className="sr-only">Buscar productos</label>
      <div className="flex items-stretch overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-teal-900/10 ring-1 ring-white/60 backdrop-blur-sm sm:rounded-full sm:pr-1.5 sm:pl-1">
        <span className="flex min-h-[52px] shrink-0 items-center pl-3 text-slate-400 sm:pl-4">
          <SearchIcon className="h-5 w-5" />
        </span>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar productos, código SKU, categoría…"
          className="min-h-[52px] w-full flex-1 border-0 bg-transparent px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:pl-2"
          autoComplete="off"
        />
        <button
          type="submit"
          className="m-1.5 shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark sm:m-0 sm:my-1.5"
        >
          Buscar
        </button>
      </div>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {suggestions.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              className="block border-b border-slate-100 px-4 py-2.5 hover:bg-brand-muted/40 last:border-b-0"
            >
              <p className="text-sm font-medium text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500">
                {item.sku ? `Código ${item.sku}` : "Sin código"}
                {item.category ? ` · ${item.category}` : ""}
              </p>
            </Link>
          ))}
          <Link
            href={`/catalog?q=${encodeURIComponent(q.trim())}`}
            className="block bg-slate-50 px-4 py-2 text-center text-xs font-semibold text-brand-dark"
          >
            Ver todos los resultados en el catálogo
          </Link>
        </div>
      ) : null}
    </form>
  );
}
