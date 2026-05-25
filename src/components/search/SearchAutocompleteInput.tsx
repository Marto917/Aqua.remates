"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Si se define, al elegir sugerencia navega al producto en lugar de enviar el formulario */
  linkOnSelect?: boolean;
  onSubmitNavigate?: (q: string) => void;
};

export function SearchAutocompleteInput({
  name = "q",
  defaultValue = "",
  placeholder = "Buscar productos…",
  className = "",
  inputClassName = "w-full rounded-md border px-3 py-2",
  linkOnSelect = false,
  onSubmitNavigate,
}: Props) {
  const [q, setQ] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQ(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

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
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        name={name}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && suggestions.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((item) => {
            const href = `/product/${item.slug}`;
            const inner = (
              <>
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  <Image
                    src={resolveProductImageUrl(item.imageUrl)}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {formatDisplayWords(item.name)}
                  </span>
                  {item.category ? (
                    <span className="block truncate text-xs text-slate-500">
                      {formatDisplayWords(item.category)}
                    </span>
                  ) : null}
                </span>
              </>
            );
            return (
              <li key={item.id} role="option">
                {linkOnSelect ? (
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setQ(item.name);
                      setOpen(false);
                      onSubmitNavigate?.(item.name);
                    }}
                  >
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
