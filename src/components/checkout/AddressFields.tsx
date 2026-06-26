"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatAddressLine,
  parseAddressLine,
  SHIPPING_ADDRESS_HINT,
  validateShippingAddressLine,
} from "@/lib/address-validation";

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
  const [addressLine, setAddressLine] = useState(() => formatAddressLine(street, streetNumber));
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const formatted = formatAddressLine(street, streetNumber);
    if (formatted !== addressLine) {
      setAddressLine(formatted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo resincronizar cuando cambian props externas
  }, [street, streetNumber]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function syncParsedLine(line: string) {
    const parsed = parseAddressLine(line);
    onStreetChange(parsed.street);
    onStreetNumberChange(parsed.number);
  }

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
    const line = s.number ? `${s.street} ${s.number}` : s.street;
    setAddressLine(line);
    onStreetChange(s.street);
    onStreetNumberChange(s.number);
    onCityChange(s.city);
    onProvinceChange(s.province);
    onPostalCodeChange(s.postalCode);
    setAddressError(null);
    setSuggestions([]);
  }

  return (
    <div className="space-y-3">
      <div ref={wrapperRef} className="relative">
        <label className="mb-1 block text-sm font-medium text-slate-700">Calle y número</label>
        <input
          required
          value={addressLine}
          onChange={(e) => {
            const value = e.target.value;
            setAddressLine(value);
            syncParsedLine(value);
            setAddressError(null);
            fetchSuggestions(value);
          }}
          onBlur={() => {
            const err = validateShippingAddressLine(addressLine);
            setAddressError(err);
          }}
          placeholder="Ej: Av. San Martín 1234"
          autoComplete="street-address"
          className={`w-full rounded-md border px-3 py-2 ${
            addressError ? "border-rose-300 ring-1 ring-rose-200" : ""
          }`}
        />
        {loading ? <p className="mt-1 text-xs text-slate-400">Buscando direcciones…</p> : null}
        {suggestions.length > 0 ? (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {suggestions.map((s) => (
              <li key={s.display}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-brand/5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                >
                  <span className="font-medium text-slate-900">
                    {s.number ? `${s.street} ${s.number}` : s.street}
                  </span>
                  {(s.city || s.province) && (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {[s.city, s.province].filter(Boolean).join(", ")}
                      {s.postalCode ? ` · CP ${s.postalCode}` : ""}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {addressError ? (
          <p className="mt-1 text-xs text-rose-600">{addressError}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">{SHIPPING_ADDRESS_HINT}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ciudad</label>
          <input
            required
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Ciudad"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Provincia</label>
          <input
            required
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
            placeholder="Provincia"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Código postal</label>
        <input
          required
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
          placeholder="Código postal"
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Referencias <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Piso, timbre, entre calles…"
          rows={2}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
