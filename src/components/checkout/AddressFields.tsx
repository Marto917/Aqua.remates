"use client";

import { useEffect, useRef, useState } from "react";
import { SHIPPING_ADDRESS_HINT } from "@/lib/address-validation";

type Suggestion = {
  display: string;
  street: string;
  number: string;
  city: string;
  province: string;
  postalCode: string;
};

type Props = {
  street: string;
  streetNumber: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
  onStreetChange: (v: string) => void;
  onStreetNumberChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onProvinceChange: (v: string) => void;
  onPostalCodeChange: (v: string) => void;
  onNotesChange: (v: string) => void;
};

export function AddressFields({
  street,
  streetNumber,
  city,
  province,
  postalCode,
  notes,
  onStreetChange,
  onStreetNumberChange,
  onCityChange,
  onProvinceChange,
  onPostalCodeChange,
  onNotesChange,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function fetchSuggestions(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 4) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function applySuggestion(s: Suggestion) {
    onStreetChange(s.street);
    onStreetNumberChange(s.number);
    onCityChange(s.city);
    onProvinceChange(s.province);
    onPostalCodeChange(s.postalCode);
    setSuggestions([]);
  }

  return (
    <div className="space-y-3">
      <div ref={wrapperRef} className="relative">
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
          <input
            required
            value={street}
            onChange={(e) => {
              onStreetChange(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            placeholder="Calle"
            autoComplete="street-address"
            className="w-full rounded-md border px-3 py-2"
          />
          <input
            required
            value={streetNumber}
            onChange={(e) => onStreetNumberChange(e.target.value)}
            placeholder="Número *"
            inputMode="numeric"
            pattern="\d+"
            title="El número de casa es obligatorio para el envío."
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        {loading ? (
          <p className="mt-1 text-xs text-slate-400">Buscando direcciones…</p>
        ) : null}
        {suggestions.length > 0 ? (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {suggestions.map((s) => (
              <li key={s.display}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand/5"
                  onClick={() => applySuggestion(s)}
                >
                  {s.display}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">{SHIPPING_ADDRESS_HINT}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="Ciudad"
          className="w-full rounded-md border px-3 py-2"
        />
        <input
          required
          value={province}
          onChange={(e) => onProvinceChange(e.target.value)}
          placeholder="Provincia"
          className="w-full rounded-md border px-3 py-2"
        />
      </div>
      <input
        required
        value={postalCode}
        onChange={(e) => onPostalCodeChange(e.target.value)}
        placeholder="Código postal"
        className="w-full rounded-md border px-3 py-2"
      />
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Referencias (piso, timbre, entre calles…)"
        rows={2}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}
