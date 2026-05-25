import { prisma } from "@/lib/prisma";

export type CatalogFilters = {
  q?: string;
  category?: string;
};

export async function getCatalogData(filters: CatalogFilters) {
  const q = filters.q?.trim();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
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
