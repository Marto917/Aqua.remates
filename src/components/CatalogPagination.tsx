import Link from "next/link";
import { buildCatalogHref, CATALOG_PAGE_SIZE, type CatalogQueryParams } from "@/lib/catalog";

type Props = {
  currentPage: number;
  totalPages: number;
  total: number;
  query: Omit<CatalogQueryParams, "page">;
};

export function CatalogPagination({ currentPage, totalPages, total, query }: Props) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * CATALOG_PAGE_SIZE + 1;
  const to = Math.min(currentPage * CATALOG_PAGE_SIZE, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex flex-col items-center gap-3 border-t border-slate-200 pt-6" aria-label="Paginación del catálogo">
      <p className="text-sm text-slate-600">
        Mostrando {from}–{to} de {total} productos
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {currentPage > 1 ? (
          <Link
            href={buildCatalogHref({ ...query, page: currentPage - 1 })}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Anterior
          </Link>
        ) : null}
        {pages.map((page) => (
          <Link
            key={page}
            href={buildCatalogHref({ ...query, page })}
            aria-current={page === currentPage ? "page" : undefined}
            className={`min-w-[2.25rem] rounded-md px-2.5 py-1.5 text-center text-sm font-medium ${
              page === currentPage
                ? "bg-brand text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {page}
          </Link>
        ))}
        {currentPage < totalPages ? (
          <Link
            href={buildCatalogHref({ ...query, page: currentPage + 1 })}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Siguiente →
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
