import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function AdminProductsPage() {
  let products: Prisma.ProductGetPayload<{ include: { category: true } }>[] = [];
  try {
    products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("No se pudieron cargar productos del backoffice:", error);
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Gestion de catalogo</h1>

      <form method="post" action="/api/admin/products" className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Crear producto</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" required placeholder="Nombre" className="rounded-md border px-3 py-2" />
          <input name="slug" required placeholder="Slug" className="rounded-md border px-3 py-2" />
          <input
            name="imageUrl"
            required
            placeholder="URL de imagen (Cloudinary o Supabase)"
            className="rounded-md border px-3 py-2"
          />
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
