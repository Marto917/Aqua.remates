"use client";

import { FormEvent, useMemo, useState } from "react";

type Props = {
  initialError?: string;
};

export function AdminProductCreateForm({ initialError }: Props) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [pickerColor, setPickerColor] = useState("#2563eb");
  const [colors, setColors] = useState<string[]>(["#2563eb"]);

  const canAdd = useMemo(() => !colors.includes(pickerColor), [colors, pickerColor]);

  function addCurrentColor() {
    if (!canAdd) return;
    setColors((prev) => [...prev, pickerColor]);
  }

  function removeColor(color: string) {
    setColors((prev) => prev.filter((c) => c !== color));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    fd.set("colorLabels", colors.join(","));

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: fd,
        headers: {
          "x-requested-with": "XMLHttpRequest",
          accept: "application/json",
        },
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar el producto.");
        setSubmitting(false);
        return;
      }

      window.location.href = "/admin/productos?ok=1";
    } catch {
      setError("No se pudo conectar con el servidor.");
      setSubmitting(false);
    }
  }

  return (
    <form
      method="post"
      action="/api/admin/products"
      encType="multipart/form-data"
      className="space-y-3 rounded-xl border bg-white p-5"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-semibold">Crear producto</h2>
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nombre del producto"
          className="rounded-md border px-3 py-2 md:col-span-2"
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Imagen del producto</label>
          <p className="mt-0.5 text-xs text-slate-500">
            Se guarda en la carpeta public (WebP comprimido, hasta ~1600 px, buena calidad).
          </p>
          <input
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </div>
        <input
          name="categoryName"
          required
          placeholder="Categoria"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="listPrice"
          required
          type="number"
          step="0.01"
          placeholder="Precio de lista"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="retailPrice"
          required
          type="number"
          step="0.01"
          placeholder="Precio minorista"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="wholesalePrice"
          required
          type="number"
          step="0.01"
          placeholder="Precio mayorista"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="discountRetailPercent"
          type="number"
          min="0"
          max="100"
          placeholder="Descuento minorista (%) - opcional"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="discountWholesalePercent"
          type="number"
          min="0"
          max="100"
          placeholder="Descuento mayorista (%) - opcional"
          className="rounded-md border px-3 py-2"
        />
      </div>

      <textarea
        name="description"
        required
        rows={3}
        placeholder="Descripcion de producto"
        className="w-full rounded-md border px-3 py-2"
      />

      <input type="hidden" name="colorLabels" value={colors.join(",")} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Colores disponibles</p>
        <div className="flex flex-wrap items-center gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              title={`Quitar ${color}`}
              onClick={() => removeColor(color)}
              className="group relative h-9 w-9 rounded-full border border-slate-300 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.15)]"
              style={{ backgroundColor: color }}
            >
              <span className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white group-hover:flex">
                ×
              </span>
            </button>
          ))}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
            <input
              type="color"
              value={pickerColor}
              onChange={(e) => setPickerColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
              aria-label="Elegir color"
            />
            <button
              type="button"
              onClick={addCurrentColor}
              disabled={!canAdd}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-lg text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Agregar color"
              title="Agregar color"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">Click en un color cargado para quitarlo.</p>
      </div>

      <div className="flex gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="isBestSeller" />
          Marcar como mas vendido
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked />
          Visible en tienda
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-brand px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Guardando..." : "Guardar producto"}
      </button>
    </form>
  );
}
