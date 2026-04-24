import { prisma } from "@/lib/prisma";
import type { CatalogFilters } from "@/lib/catalog-pricing";

export type { PriceMode, CatalogFilters } from "@/lib/catalog-pricing";
export {
  getDiscountPercentForMode,
  getFinalUnitPrice,
  getListingPriceLabel,
  getProductDisplayPrice,
} from "@/lib/catalog-pricing";

export async function getCatalogData(filters: CatalogFilters) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      name: filters.q
        ? {
            contains: filters.q,
            mode: "insensitive",
          }
        : undefined,
      category: filters.category
        ? {
            slug: filters.category,
          }
        : undefined,
    },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return { products, categories };
}
