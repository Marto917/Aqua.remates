import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  let products: Prisma.ProductGetPayload<{ include: { category: true; variants: true } }>[] = [];
  try {
    products = await prisma.product.findMany({
      include: { category: true, variants: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("No se pudieron cargar productos del backoffice:", error);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">Gestion de catalogo</h1>
        <a
          href="/api/admin/export-catalog"
          className="inline-flex shrink-0 rounded-md border border-brand bg-white px-3 py-2 text-sm font-medium text-brand-dark hover:bg-brand-muted/50"
        >
          Exportar ZIP (JSON + imagenes)
        </a>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      <form
        method="post"
        action="/api/admin/products"
        encType="multipart/form-data"
        className="space-y-3 rounded-xl border bg-white p-5"
      >
        <h2 className="text-lg font-semibold">Crear producto</h2>
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
            defaultValue={0}
            placeholder="Descuento minorista (%)"
            className="rounded-md border px-3 py-2"
          />
          <input
            name="discountWholesalePercent"
            type="number"
            min="0"
            max="100"
            defaultValue={0}
            placeholder="Descuento mayorista (%)"
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
        <div>
          <label className="text-sm text-slate-600">Colores (uno por línea o separados por coma)</label>
          <textarea
            name="colorLabels"
            rows={2}
            placeholder="Ej: Azul&#10;Rosa&#10;Negro"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
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
        <button type="submit" className="rounded-md bg-brand px-4 py-2 text-white">
          Guardar producto
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Minorista</th>
              <th className="px-3 py-2 text-left">Mayorista</th>
              <th className="px-3 py-2 text-left">Colores</th>
              <th className="px-3 py-2 text-left">Disponibilidad</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2">{product.category.name}</td>
                <td className="px-3 py-2">{Number(product.retailPrice).toFixed(2)}</td>
                <td className="px-3 py-2">{Number(product.wholesalePrice).toFixed(2)}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {product.variants.map((v) => v.colorLabel).join(", ") || "—"}
                </td>
                <td className="px-3 py-2">
                  <form method="post" action={`/api/admin/products/${product.id}`}>
                    <input type="hidden" name="isActive" value={product.isActive ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`rounded px-3 py-1 text-xs ${
                        product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {product.isActive ? "Habilitado" : "Deshabilitado"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
