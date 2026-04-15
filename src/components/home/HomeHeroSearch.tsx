"use client";

import { useState } from "react";

export function HomeHeroSearch() {
  const [q, setQ] = useState("");

  return (
    <form action="/catalog" className="relative mx-auto max-w-3xl">
      <label className="sr-only">Buscar productos</label>
      <div className="flex overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-lg shadow-teal-900/10 ring-1 ring-slate-200/80">
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="¿Qué estás buscando? Ej: cocina, organización, decoración…"
          className="min-h-[52px] flex-1 border-0 bg-transparent px-5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          autoComplete="off"
        />
        <input type="hidden" name="priceMode" value="retail" />
        <button
          type="submit"
          className="shrink-0 bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
