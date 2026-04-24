import type { Prisma } from "@prisma/client";
import { AdminProductCreateForm } from "@/components/admin/AdminProductCreateForm";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { error, ok } = await searchParams;
  let products: Prisma.ProductGetPayload<{ include: { category: true; variants: true } }>[] = [];
  let supplierNames: string[] = [];
  try {
    [products, supplierNames] = await Promise.all([
      prisma.product.findMany({
        include: { category: true, variants: { orderBy: { sortOrder: "asc" } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.product
        .findMany({
          where: { supplierName: { not: null } },
          select: { supplierName: true },
          distinct: ["supplierName"],
          orderBy: { supplierName: "asc" },
        })
        .then((rows) =>
          rows
            .map((r) => r.supplierName?.trim() ?? "")
            .filter(Boolean),
        ),
    ]);
  } catch (readError) {
    console.error("No se pudieron cargar productos del backoffice:", readError);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de catálogo</h1>
          <p className="mt-1 text-sm text-slate-600">
            Alta rápida de artículos, variantes por color e imágenes por color.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="#crear-producto"
            className="inline-flex shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + Nuevo artículo
          </a>
          <a
            href="/api/admin/export-catalog"
            className="inline-flex shrink-0 rounded-full border border-brand bg-white px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-muted/50"
          >
            Exportar catálogo
          </a>
        </div>
      </div>

      {ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Producto guardado correctamente.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      <div id="crear-producto">
        <AdminProductCreateForm initialError={error} supplierNames={supplierNames} />
      </div>

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
              <th className="px-3 py-2 text-left">Acciones</th>
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
                <td className="px-3 py-2">
                  <a
                    href={`/admin/productos/${product.id}`}
                    className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand-dark"
                  >
                    Editar imágenes
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
