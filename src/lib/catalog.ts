import { catalogVisibilityWhere, type CatalogAudience } from "@/lib/catalog-visibility";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const CATALOG_PAGE_SIZE = 25;

export type CatalogFilters = {
  q?: string;
  category?: string;
  audience?: CatalogAudience;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
};

export type CatalogQueryParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  priceMode?: string;
  page?: number;
};

export function buildCatalogHref(params: CatalogQueryParams): string {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.category) sp.set("category", params.category);
  if (params.minPrice?.trim()) sp.set("minPrice", params.minPrice.trim());
  if (params.maxPrice?.trim()) sp.set("maxPrice", params.maxPrice.trim());
  if (params.priceMode === "wholesale") sp.set("priceMode", "wholesale");
  if (params.page != null && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

function buildCatalogWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const q = filters.q?.trim();
  const audience = filters.audience ?? "retail";

  return {
    isActive: true,
    ...catalogVisibilityWhere(audience),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    category: filters.category ? { slug: filters.category } : undefined,
    ...(filters.minPrice != null || filters.maxPrice != null
      ? {
          listPrice: {
            ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
  };
}

export async function getCatalogData(filters: CatalogFilters) {
  const where = buildCatalogWhere(filters);
  const requestedPage = Math.max(1, filters.page ?? 1);

  const [total, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * CATALOG_PAGE_SIZE;

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 8 } },
      },
    },
    orderBy: { updatedAt: "desc" },
    skip,
    take: CATALOG_PAGE_SIZE,
  });

  return { products, categories, total, page, pageSize: CATALOG_PAGE_SIZE, totalPages };
}
