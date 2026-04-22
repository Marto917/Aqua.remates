"use client";

import { FormEvent, useState } from "react";
import { CATEGORY_NAMES } from "@/lib/categories";
import { COLOR_OPTIONS } from "@/lib/color-options";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";

type Props = {
  initialError?: string;
};

export function AdminProductCreateForm({ initialError }: Props) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState<Array<{ id: string; colorLabel: string }>>([
    { id: crypto.randomUUID(), colorLabel: COLOR_OPTIONS[0]?.hex ?? "#2563eb" },
  ]);

  function addVariant() {
    const nextColor = COLOR_OPTIONS[variants.length % COLOR_OPTIONS.length]?.hex ?? "#2563eb";
    setVariants((prev) => [
      ...prev,
      { id: crypto.randomUUID(), colorLabel: nextColor },
    ]);
  }

  function updateVariantColor(id: string, colorLabel: string) {
    setVariants((prev) =>
      prev.map((item) => (item.id === id ? { ...item, colorLabel } : item)),
    );
  }

  function normalizeHex(value: string): string {
    const v = value.trim();
    if (!v) return "";
    const prefixed = v.startsWith("#") ? v : `#${v}`;
    if (/^#([0-9a-f]{6})$/i.test(prefixed)) {
      return prefixed.toUpperCase();
    }
    return "";
  }

  function removeVariant(id: string) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const normalizedColors = variants
      .map((item) => normalizeHex(item.colorLabel))
      .filter(Boolean);

    if (normalizedColors.length === 0) {
      setError("Cargá al menos un color/variante.");
      return;
    }
    if (new Set(normalizedColors).size !== normalizedColors.length) {
      setError("No repitas colores en el mismo producto.");
      return;
    }

    fd.set("colorLabels", normalizedColors.join(","));

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
            Si no subís una imagen, se usa la predeterminada de Aqua. Podés cambiarla después.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Predeterminada actual: <code className="rounded bg-slate-100 px-1">{DEFAULT_PRODUCT_IMAGE}</code>
          </p>
          <input
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </div>
        <select name="categoryName" required className="rounded-md border px-3 py-2">
          <option value="">Seleccionar categoría</option>
          {CATEGORY_NAMES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
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
        rows={3}
        placeholder="Descripcion de producto (opcional)"
        className="w-full rounded-md border px-3 py-2"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">Variantes por color e imagen</p>
          <button
            type="button"
            onClick={addVariant}
            className="rounded-full border border-brand/40 px-3 py-1 text-xs font-medium text-brand-dark hover:bg-brand-muted"
          >
            + Agregar color
          </button>
        </div>
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Color</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => {
                    const isSelected = color.hex.toUpperCase() === variant.colorLabel.toUpperCase();
                    return (
                      <button
                        key={`${variant.id}-${color.hex}`}
                        type="button"
                        onClick={() => updateVariantColor(variant.id, color.hex)}
                        title={color.label}
                        aria-label={`Elegir color ${color.label}`}
                        className={`h-8 w-8 rounded-full border-2 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] transition ${
                          isSelected
                            ? "border-brand-dark ring-2 ring-brand/50 ring-offset-1"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-2">
                  <input
                    type="color"
                    value={normalizeHex(variant.colorLabel) || "#2563eb"}
                    onChange={(event) => updateVariantColor(variant.id, event.target.value)}
                    aria-label="Elegir color personalizado"
                    className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                  />
                  <input
                    value={variant.colorLabel}
                    onChange={(event) => updateVariantColor(variant.id, event.target.value)}
                    placeholder="#2563EB"
                    className="w-full rounded-md border px-2 py-1.5 text-xs uppercase"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Seleccionado:{" "}
                  <span className="font-medium text-slate-900">{normalizeHex(variant.colorLabel) || "inválido"}</span>
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">
                  Imagen específica del color (opcional)
                </label>
                <input
                  name={`variantImage_${index}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Si no cargás imagen de variante, se usa la imagen principal del producto.
                </p>
              </div>
              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={() => removeVariant(variant.id)}
                  className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={variants.length === 1}
                >
                  Quitar variante
                </button>
              </div>
            </div>
          ))}
          <input
            type="hidden"
            name="colorLabels"
            value={variants
              .map((variant) => variant.colorLabel.trim())
              .filter(Boolean)
              .join(",")}
          />
        </div>
        <p className="text-xs text-slate-500">
          Al elegir un color en la ficha del producto, se mostrará su imagen específica si existe.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
          <input type="checkbox" name="isBestSeller" />
          Marcar como más vendido
        </label>
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
          <input type="checkbox" name="isActive" defaultChecked />
          Visible en tienda
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Guardando..." : "Guardar producto"}
      </button>
    </form>
  );
}
