"use client";

import { ProductBarcodesEditor } from "@/components/admin/ProductBarcodesEditor";
import { IconPencil } from "@/components/icons/StaffIcons";

type Props = {
  productId: string;
  name: string;
  sku: string | null;
  barcodes?: Array<{ code: string; label?: string | null }>;
  description: string;
  supplierName: string | null;
  listPrice: number;
  wholesalePrice: number;
  categories: { id: string; name: string }[];
  categoryName: string;
};

export function AdminProductEditDetails({
  productId,
  name,
  sku,
  barcodes,
  description,
  supplierName,
  listPrice,
  wholesalePrice,
  categories,
  categoryName,
}: Props) {
  const initialBarcodes =
    barcodes && barcodes.length > 0
      ? barcodes
      : sku?.trim()
        ? [{ code: sku.trim() }]
        : [{ code: "" }];

  return (
    <form
      method="post"
      action={`/api/admin/products/${productId}`}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <input type="hidden" name="intent" value="update_details" />
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
        <IconPencil className="h-4 w-4 text-brand-dark" aria-hidden />
        <span>Datos y precios</span>
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          required
          defaultValue={name}
          placeholder="Nombre"
          className="min-h-11 rounded-md border px-3 py-2 md:col-span-2"
        />
        <ProductBarcodesEditor initial={initialBarcodes} />
        <input
          name="supplierName"
          defaultValue={supplierName ?? ""}
          placeholder="Proveedor"
          className="min-h-11 rounded-md border px-3 py-2"
        />
        <select
          name="categoryName"
          required
          defaultValue={categoryName}
          className="min-h-11 rounded-md border px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="listPrice"
          required
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={listPrice}
          placeholder="Precio de lista"
          className="min-h-11 rounded-md border px-3 py-2"
        />
        <input
          name="wholesalePrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={wholesalePrice}
          placeholder="Precio mayorista"
          className="min-h-11 rounded-md border px-3 py-2"
        />
      </div>
      <p className="text-xs text-slate-500">
        El precio con transferencia se calcula automáticamente según las promociones del catálogo.
      </p>
      <textarea
        name="description"
        rows={3}
        defaultValue={description}
        placeholder="Descripción"
        className="w-full rounded-md border px-3 py-2"
      />
      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:w-auto"
      >
        <IconPencil className="h-4 w-4" aria-hidden />
        Guardar datos
      </button>
    </form>
  );
}
