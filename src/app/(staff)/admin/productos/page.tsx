import type { Prisma } from "@prisma/client";
import { AdminProductCreatePanel } from "@/components/admin/AdminProductCreatePanel";
import { ProductVisibilitySelect } from "@/components/admin/ProductVisibilitySelect";
import { IconCamera, IconPencil, IconToggle } from "@/components/icons/StaffIcons";
import { formatArs } from "@/lib/currency";
import { formatVariantColorsForStaff } from "@/lib/color-display";
import { getProductCompletenessIssues } from "@/lib/product-completeness";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ error?: string; ok?: string }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { error, ok } = await searchParams;
  let products: Prisma.ProductGetPayload<{ include: { category: true; variants: true } }>[] = [];
  let supplierNames: string[] = [];
  let categories: { id: string; name: string; slug: string }[] = [];
  try {
    [products, supplierNames, categories] = await Promise.all([
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
      prisma.category.findMany({ orderBy: { name: "asc" } }),
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

      <AdminProductCreatePanel
        initialError={error}
        supplierNames={supplierNames}
        categories={categories}
        defaultOpen={Boolean(error)}
      />

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Precio</th>
              <th className="px-3 py-2 text-left">Mayorista</th>
              <th className="px-3 py-2 text-left">Colores</th>
              <th className="px-3 py-2 text-left">Visibilidad</th>
              <th className="px-3 py-2 text-left">Disponibilidad</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const issues = getProductCompletenessIssues(product);
              return (
              <tr key={product.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="flex items-start gap-2">
                    {issues.length > 0 ? (
                      <span
                        className="mt-0.5 shrink-0 text-amber-600"
                        title={`Datos incompletos: ${issues.join(", ")}`}
                        aria-label={`Incompleto: ${issues.join(", ")}`}
                      >
                        ⚠️
                      </span>
                    ) : null}
                    <span>{product.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2">{product.category.name}</td>
                <td className="px-3 py-2">{formatArs(Number(product.listPrice))}</td>
                <td className="px-3 py-2">{formatArs(Number(product.wholesalePrice))}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {formatVariantColorsForStaff(product.variants.map((v) => v.colorLabel))}
                </td>
                <td className="px-3 py-2">
                  <ProductVisibilitySelect
                    productId={product.id}
                    value={product.catalogVisibility}
                  />
                </td>
                <td className="px-3 py-2">
                  <form method="post" action={`/api/admin/products/${product.id}`}>
                    <input type="hidden" name="isActive" value={product.isActive ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                        product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                      aria-label={product.isActive ? "Deshabilitar producto" : "Habilitar producto"}
                      title={product.isActive ? "Visible en tienda" : "Oculto en tienda"}
                    >
                      <IconToggle className="h-4 w-4" />
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <a
                      href={`/admin/productos/${product.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:border-brand hover:text-brand-dark"
                      aria-label="Editar producto"
                      title="Editar"
                    >
                      <IconPencil className="h-4 w-4" />
                    </a>
                    <a
                      href={`/admin/productos/${product.id}#imagenes`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:border-brand hover:text-brand-dark"
                      aria-label="Editar imágenes"
                      title="Imágenes"
                    >
                      <IconCamera className="h-4 w-4" />
                    </a>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
