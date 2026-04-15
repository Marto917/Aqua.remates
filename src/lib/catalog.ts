import { prisma } from "@/lib/prisma";

export type PriceMode = "retail" | "wholesale";

export type CatalogFilters = {
  q?: string;
  category?: string;
  priceMode?: PriceMode;
};

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

export function getProductDisplayPrice(
  product: { retailPrice: unknown; wholesalePrice: unknown },
  mode: PriceMode,
) {
  const value = mode === "wholesale" ? product.wholesalePrice : product.retailPrice;
  return Number(value).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
