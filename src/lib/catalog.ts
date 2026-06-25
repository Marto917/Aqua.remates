import { catalogVisibilityWhere, type CatalogAudience } from "@/lib/catalog-visibility";
import { prisma } from "@/lib/prisma";

export type CatalogFilters = {
  q?: string;
  category?: string;
  audience?: CatalogAudience;
  minPrice?: number;
  maxPrice?: number;
};

export async function getCatalogData(filters: CatalogFilters) {
  const q = filters.q?.trim();
  const audience = filters.audience ?? "retail";

  const products = await prisma.product.findMany({
    where: {
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
    },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return { products, categories };
}
