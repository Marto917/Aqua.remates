"use client";

import { useId, useRef, useState } from "react";
import { BarcodeCameraScanner } from "@/components/barcode/BarcodeCameraScanner";

export type BarcodeRow = {
  id: string;
  code: string;
  label: string;
};

type Props = {
  /** Códigos iniciales (edición). El primero es el principal. */
  initial?: Array<{ code: string; label?: string | null }>;
  disabled?: boolean;
};

function newRow(code = "", label = ""): BarcodeRow {
  return { id: crypto.randomUUID(), code, label };
}

export function ProductBarcodesEditor({ initial, disabled }: Props) {
  const baseId = useId();
  const [rows, setRows] = useState<BarcodeRow[]>(() => {
    if (initial && initial.length > 0) {
      return initial.map((b) => newRow(b.code, b.label ?? ""));
    }
    return [newRow()];
  });
  const [focusIndex, setFocusIndex] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateRow(id: string, patch: Partial<Pick<BarcodeRow, "code" | "label">>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => {
      const next = [...prev, newRow()];
      setFocusIndex(next.length - 1);
      queueMicrotask(() => inputRefs.current[next.length - 1]?.focus());
      return next;
    });
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? [newRow()] : prev.filter((r) => r.id !== id)));
  }

  function applyScan(code: string) {
    setRows((prev) => {
      const idx = Math.min(Math.max(focusIndex, 0), Math.max(prev.length - 1, 0));
      const target = prev[idx];
      if (!target) {
        const next = [newRow(code)];
        setFocusIndex(0);
        return next;
      }
      if (!target.code.trim()) {
        queueMicrotask(() => inputRefs.current[idx]?.focus());
        return prev.map((r, i) => (i === idx ? { ...r, code } : r));
      }
      const next = [...prev, newRow(code)];
      setFocusIndex(next.length - 1);
      queueMicrotask(() => inputRefs.current[next.length - 1]?.focus());
      return next;
    });
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <div>
        <p className="text-sm font-medium text-slate-800">Códigos de barra</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Varios códigos para el mismo artículo (otro proveedor, color o envase). El primero es el
          principal para búsqueda.
        </p>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={row.id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {index === 0 ? "Principal" : `Extra ${index}`}
              </span>
              {rows.length > 1 ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeRow(row.id)}
                  className="text-xs font-medium text-rose-700 hover:underline disabled:opacity-50"
                >
                  Quitar
                </button>
              ) : null}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_9rem]">
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                id={`${baseId}-code-${index}`}
                name={`barcode_${index}`}
                value={row.code}
                onChange={(e) => updateRow(row.id, { code: e.target.value })}
                onFocus={() => setFocusIndex(index)}
                placeholder="Código / barras"
                autoComplete="off"
                disabled={disabled}
                className="min-h-11 w-full rounded-md border px-3 py-2 font-mono text-sm"
              />
              <input
                name={`barcodeLabel_${index}`}
                value={row.label}
                onChange={(e) => updateRow(row.id, { label: e.target.value })}
                onFocus={() => setFocusIndex(index)}
                placeholder="Nota (opc.)"
                disabled={disabled}
                className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
                aria-label="Nota del código"
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Compat: APIs antiguas leen "sku" como el primer código. */}
      <input type="hidden" name="sku" value={rows[0]?.code ?? ""} />

      <button
        type="button"
        disabled={disabled}
        onClick={addRow}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-dashed border-brand bg-white px-4 text-sm font-semibold text-brand-dark hover:bg-brand-muted/40 disabled:opacity-50 sm:w-auto"
      >
        + Agregar otro código
      </button>

      <BarcodeCameraScanner
        title="Escanear código con cámara"
        hint="Completa el renglón activo, o agrega uno nuevo si ese ya tiene código."
        onScan={applyScan}
        disabled={disabled}
      />
    </div>
  );
}
