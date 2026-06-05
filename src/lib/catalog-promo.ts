import { prisma } from "@/lib/prisma";

export type CatalogPromoSettings = {
  enabled: boolean;
  badgePercent: number | null;
  discountPercent: number | null;
  /** Vacío = aplica a todas las categorías. */
  categoryIds: string[];
};

export const DEFAULT_CATALOG_PROMO: CatalogPromoSettings = {
  enabled: false,
  badgePercent: null,
  discountPercent: null,
  categoryIds: [],
};

function parseCategoryIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function getCatalogPromoSettings(): Promise<CatalogPromoSettings> {
  try {
    const row = await prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: {
        catalogPromoEnabled: true,
        catalogPromoBadgePercent: true,
        catalogPromoDiscountPercent: true,
        catalogPromoCategoryIds: true,
      },
    });
    if (!row) return DEFAULT_CATALOG_PROMO;
    return {
      enabled: row.catalogPromoEnabled,
      badgePercent: row.catalogPromoBadgePercent,
      discountPercent: row.catalogPromoDiscountPercent,
      categoryIds: parseCategoryIds(row.catalogPromoCategoryIds),
    };
  } catch {
    return DEFAULT_CATALOG_PROMO;
  }
}

export function isProductInCatalogPromo(
  categoryId: string | undefined | null,
  promo: CatalogPromoSettings,
): boolean {
  if (!promo.enabled) return false;
  if (!promo.discountPercent || promo.discountPercent <= 0) return false;
  if (!categoryId) return false;
  if (promo.categoryIds.length === 0) return true;
  return promo.categoryIds.includes(categoryId);
}
