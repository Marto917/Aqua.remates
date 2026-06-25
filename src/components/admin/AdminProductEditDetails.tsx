import { IconPencil } from "@/components/icons/StaffIcons";

type Props = {
  productId: string;
  name: string;
  sku: string | null;
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
  description,
  supplierName,
  listPrice,
  wholesalePrice,
  categories,
  categoryName,
}: Props) {
  return (
    <form
      method="post"
      action={`/api/admin/products/${productId}`}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
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
          className="rounded-md border px-3 py-2 md:col-span-2"
        />
        <div>
          <input
            name="sku"
            defaultValue={sku ?? ""}
            placeholder="Código / barras"
            autoComplete="off"
            className="w-full rounded-md border px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Escaneo con lector USB; no visible en la tienda.</p>
        </div>
        <input
          name="supplierName"
          defaultValue={supplierName ?? ""}
          placeholder="Proveedor"
          className="rounded-md border px-3 py-2"
        />
        <select name="categoryName" required defaultValue={categoryName} className="rounded-md border px-3 py-2">
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
          className="rounded-md border px-3 py-2"
        />
        <input
          name="wholesalePrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={wholesalePrice}
          placeholder="Precio mayorista"
          className="rounded-md border px-3 py-2"
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
        aria-label="Guardar datos y precios"
        title="Guardar"
      >
        <IconPencil className="h-4 w-4" />
      </button>
    </form>
  );
}
