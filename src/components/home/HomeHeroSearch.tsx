"use client";

import { useState } from "react";

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

export function HomeHeroSearch() {
  const [q, setQ] = useState("");

  return (
    <form action="/catalog" className="relative mx-auto max-w-2xl">
      <label className="sr-only">Buscar productos</label>
      <div className="flex items-stretch overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-teal-900/10 ring-1 ring-white/60 backdrop-blur-sm sm:rounded-full sm:pr-1.5 sm:pl-1">
        <span className="hidden min-h-[52px] items-center pl-4 text-slate-400 sm:flex">
          <SearchIcon className="h-5 w-5" />
        </span>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscá en el catálogo: cocina, baño, ferretería…"
          className="min-h-[52px] w-full flex-1 border-0 bg-transparent px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:pl-2"
          autoComplete="off"
        />
        <input type="hidden" name="priceMode" value="retail" />
        <button
          type="submit"
          className="m-1.5 shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark sm:m-0 sm:my-1.5 sm:rounded-full"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
