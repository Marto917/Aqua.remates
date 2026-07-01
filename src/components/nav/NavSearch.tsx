"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconSearch } from "@/components/icons/NavIcons";
import { formatDisplayWords } from "@/lib/display-text";
import { resolveProductImageUrl } from "@/lib/product-images";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  sku?: string | null;
  category?: string;
  imageUrl?: string | null;
};

type Props = {
  onOpenChange: (open: boolean) => void;
};

export function NavSearch({ onOpenChange }: Props) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalHint, setTotalHint] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onOpenChange]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { items?: Suggestion[]; total?: number };
        const items = data.items ?? [];
        setSuggestions(items);
        setTotalHint(data.total ?? items.length);
        setDropdownOpen(items.length > 0 || term.length >= 2);
      } catch {
        setSuggestions([]);
        setDropdownOpen(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  return (
    <div
      ref={wrapRef}
      className="fixed inset-x-0 top-[var(--store-nav-height,3.25rem)] z-50 border-b border-teal-100 bg-white px-3 py-3 shadow-md sm:absolute sm:inset-x-0 sm:top-full sm:px-4"
    >
      <div className="relative mx-auto max-w-3xl">
        <form
          action="/catalog"
          className="flex items-center overflow-hidden rounded-md border border-slate-200 bg-white"
          onSubmit={() => onOpenChange(false)}
        >
          <input
            ref={inputRef}
            name="q"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (v.trim().length < 2) {
              setSuggestions([]);
              setTotalHint(null);
              setDropdownOpen(false);
            }
          }}
          onFocus={() => setDropdownOpen(suggestions.length > 0 || q.trim().length >= 2)}
            placeholder="Buscar productos…"
            className="min-h-11 w-full flex-1 border-0 px-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            autoComplete="off"
          />
          <button
            type="submit"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-500 hover:text-brand-dark"
            aria-label="Buscar"
          >
            <IconSearch className="h-5 w-5" />
          </button>
        </form>

        {dropdownOpen && q.trim().length >= 2 ? (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 max-h-[min(70vh,420px)] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl">
            {suggestions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Sin resultados</p>
            ) : (
              <ul>
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 hover:bg-slate-50 last:border-b-0"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-slate-100">
                        <Image
                          src={resolveProductImageUrl(item.imageUrl)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold uppercase tracking-wide text-slate-900">
                          {formatDisplayWords(item.name)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {item.category ? formatDisplayWords(item.category) : "Producto"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/catalog?q=${encodeURIComponent(q.trim())}`}
              onClick={() => onOpenChange(false)}
              className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-brand-dark hover:bg-brand-muted/30"
            >
              {totalHint && totalHint > suggestions.length
                ? `Mostrar todos los resultados (${totalHint}) →`
                : "Ver todos en el catálogo →"}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
