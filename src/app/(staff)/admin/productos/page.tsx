import type { CatalogVisibility, Prisma } from "@prisma/client";
import { AdminCatalogFilters } from "@/components/admin/AdminCatalogFilters";
import { AdminProductCreatePanel } from "@/components/admin/AdminProductCreatePanel";
import {
  ExportCatalogButton,
  ExportCatalogTextButton,
} from "@/components/admin/ExportCatalogButton";
import { ProductVisibilitySelect } from "@/components/admin/ProductVisibilitySelect";
import { IconCamera, IconPencil, IconToggle } from "@/components/icons/StaffIcons";
import { formatArs } from "@/lib/currency";
import { formatVariantColorsForStaff } from "@/lib/color-display";
import { CATALOG_VISIBILITY_LABELS } from "@/lib/catalog-visibility";
import { getProductCompletenessIssues } from "@/lib/product-completeness";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    ok?: string;
    q?: string;
    category?: string;
    active?: string;
    visibility?: string;
    supplier?: string;
    incomplete?: string;
  }>;
};

type CatalogProduct = Prisma.ProductGetPayload<{
  include: { category: true; variants: true; barcodes: { select: { code: true } } };
}>;

const VISIBILITY_KEYS = Object.keys(CATALOG_VISIBILITY_LABELS) as CatalogVisibility[];

function ProductIssuesBadge({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <span className="group relative mt-0.5 inline-flex shrink-0">
      <span
        tabIndex={0}
        className="cursor-help text-amber-600 outline-none"
        aria-label={`Incompleto: ${issues.join(", ")}`}
      >
        ⚠️
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[16rem] rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-left text-xs font-medium text-amber-950 shadow-md group-hover:block group-focus-within:block"
      >
        <span className="block font-semibold text-amber-900">Falta completar:</span>
        <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </span>
    </span>
  );
}

function ProductActionButtons({ product }: { product: CatalogProduct }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form method="post" action={`/api/admin/products/${product.id}`}>
        <input type="hidden" name="isActive" value={product.isActive ? "false" : "true"} />
        <button
          type="submit"
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full ${
            product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }`}
          aria-label={product.isActive ? "Deshabilitar producto" : "Habilitar producto"}
          title={product.isActive ? "Visible en tienda" : "Oculto en tienda"}
        >
          <IconToggle className="h-4 w-4" />
        </button>
      </form>
      <a
        href={`/admin/productos/${product.id}`}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-brand bg-brand px-3.5 text-sm font-semibold text-white hover:bg-brand-dark"
        aria-label="Editar producto"
      >
        <IconPencil className="h-4 w-4" />
        <span>Editar</span>
      </a>
      <a
        href={`/admin/productos/${product.id}#imagenes`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:border-brand hover:text-brand-dark"
        aria-label="Editar imágenes"
        title="Imágenes"
      >
        <IconCamera className="h-4 w-4" />
      </a>
    </div>
  );
}

function buildAdminCatalogWhere(filters: {
  q: string;
  category: string;
  active: string;
  visibility: string;
  supplier: string;
}): Prisma.ProductWhereInput {
  const q = filters.q.trim();
  const where: Prisma.ProductWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { supplierName: { contains: q, mode: "insensitive" } },
      { barcodes: { some: { code: { contains: q, mode: "insensitive" } } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (filters.category) {
    where.categoryId = filters.category;
  }

  if (filters.active === "1") where.isActive = true;
  if (filters.active === "0") where.isActive = false;

  if (filters.visibility && VISIBILITY_KEYS.includes(filters.visibility as CatalogVisibility)) {
    where.catalogVisibility = filters.visibility as CatalogVisibility;
  }

  if (filters.supplier) {
    where.supplierName = filters.supplier;
  }

  return where;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { error, ok } = sp;
  const filterValues = {
    q: sp.q?.trim() ?? "",
    category: sp.category?.trim() ?? "",
    active: sp.active === "1" || sp.active === "0" ? sp.active : "",
    visibility: sp.visibility?.trim() ?? "",
    supplier: sp.supplier?.trim() ?? "",
    incomplete: sp.incomplete === "1",
  };

  let products: CatalogProduct[] = [];
  let totalCount = 0;
  let supplierNames: string[] = [];
  let categories: { id: string; name: string; slug: string }[] = [];

  try {
    const where = buildAdminCatalogWhere(filterValues);
    [products, totalCount, supplierNames, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: { orderBy: { sortOrder: "asc" } },
          barcodes: { select: { code: true } },
        },
        orderBy: [{ name: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.product.count(),
      prisma.product
        .findMany({
          where: { supplierName: { not: null } },
          select: { supplierName: true },
          distinct: ["supplierName"],
          orderBy: { supplierName: "asc" },
        })
        .then((rows) => rows.map((r) => r.supplierName?.trim() ?? "").filter(Boolean)),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);
  } catch (readError) {
    console.error("No se pudieron cargar productos del backoffice:", readError);
  }

  if (filterValues.incomplete) {
    products = products.filter((p) => getProductCompletenessIssues(p).length > 0);
  }

  // Si el proveedor del filtro ya no existe en la lista, no romper el select
  const suppliers =
    filterValues.supplier && !supplierNames.includes(filterValues.supplier)
      ? [...supplierNames, filterValues.supplier].sort((a, b) => a.localeCompare(b, "es"))
      : supplierNames;

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
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + Nuevo artículo
          </a>
          <ExportCatalogTextButton />
          <ExportCatalogButton />
        </div>
      </div>

      {ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Producto guardado correctamente.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <AdminProductCreatePanel
        initialError={error}
        supplierNames={supplierNames}
        categories={categories}
        defaultOpen={Boolean(error)}
      />

      <AdminCatalogFilters
        categories={categories}
        suppliers={suppliers}
        values={filterValues}
        resultCount={products.length}
        totalCount={totalCount}
      />

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
          No hay artículos con esos filtros.
        </p>
      ) : (
        <>
          {/* Mobile: tarjetas con acciones siempre visibles */}
          <ul className="space-y-3 md:hidden">
            {products.map((product) => {
              const issues = getProductCompletenessIssues(product);
              return (
                <li
                  key={product.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <ProductIssuesBadge issues={issues} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{product.category.name}</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatArs(Number(product.listPrice))}
                        <span className="text-slate-400"> · </span>
                        May. {formatArs(Number(product.wholesalePrice))}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatVariantColorsForStaff(product.variants.map((v) => v.colorLabel))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <ProductVisibilitySelect
                      productId={product.id}
                      value={product.catalogVisibility}
                    />
                    <ProductActionButtons product={product} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: tabla */}
          <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
            <table className="w-full min-w-[720px] text-sm">
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
                          <ProductIssuesBadge issues={issues} />
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
                          <input
                            type="hidden"
                            name="isActive"
                            value={product.isActive ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                              product.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                            aria-label={
                              product.isActive ? "Deshabilitar producto" : "Habilitar producto"
                            }
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
        </>
      )}
    </section>
  );
}
