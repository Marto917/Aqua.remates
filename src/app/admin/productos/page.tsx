import type { Prisma } from "@prisma/client";
import { AdminProductCreateForm } from "@/components/admin/AdminProductCreateForm";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { error, ok } = await searchParams;
  let products: Prisma.ProductGetPayload<{ include: { category: true; variants: true } }>[] = [];
  try {
    products = await prisma.product.findMany({
      include: { category: true, variants: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
  } catch (readError) {
    console.error("No se pudieron cargar productos del backoffice:", readError);
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

      {ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Producto guardado correctamente.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      <AdminProductCreateForm initialError={error} />

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
