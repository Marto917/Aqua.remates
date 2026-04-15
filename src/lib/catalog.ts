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

export function getFinalUnitPrice(
  product: {
    retailPrice: unknown;
    wholesalePrice: unknown;
    discountRetailPercent: number;
    discountWholesalePercent: number;
  },
  mode: PriceMode,
) {
  const base =
    mode === "wholesale" ? Number(product.wholesalePrice) : Number(product.retailPrice);
  const pct =
    mode === "wholesale" ? product.discountWholesalePercent : product.discountRetailPercent;
  return base * (1 - Math.min(100, Math.max(0, pct)) / 100);
}

export function getProductDisplayPrice(
  product: {
    retailPrice: unknown;
    wholesalePrice: unknown;
    discountRetailPercent: number;
    discountWholesalePercent: number;
  },
  mode: PriceMode,
) {
  return getFinalUnitPrice(product, mode).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export function getDiscountPercentForMode(
  product: { discountRetailPercent: number; discountWholesalePercent: number },
  mode: PriceMode,
) {
  return mode === "wholesale" ? product.discountWholesalePercent : product.discountRetailPercent;
}
