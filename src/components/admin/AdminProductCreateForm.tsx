"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { ProductBarcodesEditor } from "@/components/admin/ProductBarcodesEditor";
import { IconCamera } from "@/components/icons/StaffIcons";
import { COLOR_OPTIONS } from "@/lib/color-options";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  initialError?: string;
  supplierNames?: string[];
  categories: { id: string; name: string; slug: string }[];
};

type MeliImportResult = {
  itemId: string;
  title: string;
  description: string;
  barcode: string | null;
  meliPrice: number | null;
  permalink: string | null;
  importedImageUrl: string | null;
  pictures: Array<{ sourceUrl: string; localUrl?: string }>;
};

export function AdminProductCreateForm({ initialError, supplierNames = [], categories }: Props) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState<Array<{ id: string; colorLabel: string }>>([
    { id: crypto.randomUUID(), colorLabel: COLOR_OPTIONS[0]?.hex ?? "#2563eb" },
  ]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [meliUrl, setMeliUrl] = useState("");
  const [meliLoading, setMeliLoading] = useState(false);
  const [meliError, setMeliError] = useState<string | null>(null);
  const [meliOk, setMeliOk] = useState<string | null>(null);
  const [meliRefPrice, setMeliRefPrice] = useState<number | null>(null);
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null);
  const [previewPictures, setPreviewPictures] = useState<
    Array<{ src: string; label: string }>
  >([]);
  const [barcodeSeed, setBarcodeSeed] = useState<Array<{ code: string; label?: string | null }>>(
    [],
  );
  const [barcodeEditorKey, setBarcodeEditorKey] = useState(0);

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

  function applyMeliImport(item: MeliImportResult) {
    setName(item.title);
    setDescription(item.description);
    setMeliRefPrice(item.meliPrice);
    setImportedImageUrl(item.importedImageUrl);
    setPreviewPictures(
      item.pictures.map((p, i) => ({
        src: resolveProductImageUrl(p.localUrl || p.sourceUrl),
        label: i === 0 ? "Principal" : `Foto ${i + 1}`,
      })),
    );

    if (item.barcode) {
      setBarcodeSeed([{ code: item.barcode, label: "ML / EAN" }]);
    } else {
      setBarcodeSeed([]);
    }
    setBarcodeEditorKey((k) => k + 1);

    const priceHint =
      item.meliPrice != null
        ? ` Precio en ML (referencia): $${item.meliPrice.toLocaleString("es-AR")}.`
        : "";
    setMeliOk(
      `Datos de ${item.itemId} cargados.${priceHint} Revisá categoría, proveedor y precios antes de guardar.`,
    );
  }

  async function onImportMeli() {
    setMeliLoading(true);
    setMeliError(null);
    setMeliOk(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/import-meli", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: meliUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        item?: MeliImportResult;
      };
      if (!res.ok || !data.ok || !data.item) {
        setMeliError(data.error ?? "No se pudo importar el artículo.");
        return;
      }
      applyMeliImport(data.item);
    } catch {
      setMeliError("No se pudo conectar con el servidor.");
    } finally {
      setMeliLoading(false);
    }
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
    fd.set("name", name.trim());
    fd.set("description", description);
    if (importedImageUrl) {
      fd.set("importedImageUrl", importedImageUrl);
    }

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
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-2 rounded-xl border border-dashed border-brand/40 bg-brand-muted/30 p-4">
        <p className="text-sm font-semibold text-slate-900">Importar desde Mercado Libre</p>
        <p className="text-xs text-slate-600">
          Pegá el link de <strong>un</strong> artículo. Se completan nombre, descripción, fotos y
          código (si viene). Vos confirmás categoría, proveedor y precios. Solo usá artículos que el
          proveedor autorice.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={meliUrl}
            onChange={(e) => setMeliUrl(e.target.value)}
            placeholder="https://articulo.mercadolibre.com.ar/MLA-…"
            disabled={meliLoading || submitting}
            className="min-h-11 w-full flex-1 rounded-md border px-3 py-2 text-sm"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void onImportMeli()}
            disabled={meliLoading || submitting || !meliUrl.trim()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {meliLoading ? "Trayendo…" : "Traer de Mercado Libre"}
          </button>
        </div>
        {meliError ? (
          <p className="text-sm text-rose-700" role="alert">
            {meliError}
          </p>
        ) : null}
        {meliOk ? (
          <p className="text-sm text-emerald-800" role="status">
            {meliOk}
          </p>
        ) : null}
        {meliRefPrice != null ? (
          <p className="text-xs text-slate-500">
            Referencia ML:{" "}
            <span className="font-medium text-slate-700">
              ${meliRefPrice.toLocaleString("es-AR")}
            </span>{" "}
            — no se copia al precio de Aqua; cargalo vos abajo.
          </p>
        ) : null}
        {previewPictures.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {previewPictures.map((pic) => (
              <div
                key={pic.src}
                className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-white"
                title={pic.label}
              >
                <Image
                  src={pic.src}
                  alt={pic.label}
                  fill
                  className="object-contain"
                  sizes="64px"
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : null}
        {importedImageUrl ? (
          <input type="hidden" name="importedImageUrl" value={importedImageUrl} />
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          className="rounded-md border px-3 py-2 md:col-span-2"
        />
        <div className="md:col-span-2">
          <input
            name="supplierName"
            list="supplier-list"
            required
            placeholder="Proveedor"
            className="w-full rounded-md border px-3 py-2"
          />
          <datalist id="supplier-list">
            {supplierNames.map((supplier) => (
              <option key={supplier} value={supplier} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-slate-500">
            Podés escribir uno nuevo o elegir uno ya cargado.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <IconCamera className="h-5 w-5 text-brand-dark" aria-hidden />
            {importedImageUrl
              ? "Cambiar imagen (opcional; si no tocás, se usa la de ML)"
              : "Imagen del producto"}
            <input
              name="imageFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
            />
          </label>
        </div>
        <ProductBarcodesEditor
          key={barcodeEditorKey}
          initial={barcodeSeed.length > 0 ? barcodeSeed : undefined}
          disabled={submitting}
        />
        <select name="categoryName" required className="rounded-md border px-3 py-2">
          <option value="">Seleccionar categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          name="listPrice"
          required
          type="number"
          step="0.01"
          value={listPrice}
          onChange={(e) => setListPrice(e.target.value)}
          placeholder="Precio de lista"
          className="rounded-md border px-3 py-2 md:col-span-2"
        />
      </div>
      <p className="text-xs text-slate-500">
        El precio con transferencia se calcula con el descuento configurado en Promociones.
      </p>

      <textarea
        name="description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
                  <span className="font-medium text-slate-900">
                    {normalizeHex(variant.colorLabel) || "inválido"}
                  </span>
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
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
        aria-label="Guardar producto"
      >
        {submitting ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
