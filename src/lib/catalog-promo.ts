import { prisma } from "@/lib/prisma";

export type CatalogPromoMode = "global" | "byCategory";

export type CatalogPromoSettings = {
  enabled: boolean;
  mode: CatalogPromoMode;
  /** % único para todo el catálogo (modo global). */
  globalPercent: number | null;
  /** categoryId → % (modo por categoría). */
  categoryPercents: Record<string, number>;
};

export const DEFAULT_CATALOG_PROMO: CatalogPromoSettings = {
  enabled: false,
  mode: "global",
  globalPercent: null,
  categoryPercents: {},
};

type CatalogPromoRulesJson = {
  mode?: CatalogPromoMode;
  globalPercent?: number | null;
  categoryPercents?: Record<string, number>;
};

function parseCategoryIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function parseCategoryPercents(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 99) {
      out[key] = Math.round(value);
    }
  }
  return out;
}

function parseRulesJson(raw: unknown): CatalogPromoSettings | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rules = raw as CatalogPromoRulesJson;
  const mode: CatalogPromoMode = rules.mode === "byCategory" ? "byCategory" : "global";
  const globalPercent =
    typeof rules.globalPercent === "number" && rules.globalPercent >= 1 && rules.globalPercent <= 99
      ? Math.round(rules.globalPercent)
      : null;
  const categoryPercents = parseCategoryPercents(rules.categoryPercents);
  return { enabled: true, mode, globalPercent, categoryPercents };
}

function legacyFromRow(row: {
  catalogPromoEnabled: boolean;
  catalogPromoBadgePercent: number | null;
  catalogPromoDiscountPercent: number | null;
  catalogPromoCategoryIds: unknown;
}): CatalogPromoSettings {
  if (!row.catalogPromoEnabled) return DEFAULT_CATALOG_PROMO;

  const percent = row.catalogPromoBadgePercent ?? row.catalogPromoDiscountPercent;
  const categoryIds = parseCategoryIds(row.catalogPromoCategoryIds);

  if (categoryIds.length === 0) {
    return {
      enabled: true,
      mode: "global",
      globalPercent: percent,
      categoryPercents: {},
    };
  }

  const categoryPercents: Record<string, number> = {};
  if (percent != null) {
    for (const id of categoryIds) categoryPercents[id] = percent;
  }

  return {
    enabled: true,
    mode: "byCategory",
    globalPercent: null,
    categoryPercents,
  };
}

export function getProductCatalogPromoPercent(
  categoryId: string | undefined | null,
  promo: CatalogPromoSettings,
): number | null {
  if (!promo.enabled || !categoryId) return null;

  if (promo.mode === "global") {
    return promo.globalPercent != null && promo.globalPercent > 0 ? promo.globalPercent : null;
  }

  const pct = promo.categoryPercents[categoryId];
  return pct != null && pct > 0 ? pct : null;
}

/** @deprecated Usar getProductCatalogPromoPercent */
export function isProductInCatalogPromo(
  categoryId: string | undefined | null,
  promo: CatalogPromoSettings,
): boolean {
  return getProductCatalogPromoPercent(categoryId, promo) != null;
}

export async function getCatalogPromoSettings(): Promise<CatalogPromoSettings> {
  try {
    const row = await prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: {
        catalogPromoEnabled: true,
        catalogPromoRules: true,
        catalogPromoBadgePercent: true,
        catalogPromoDiscountPercent: true,
        catalogPromoCategoryIds: true,
      },
    });
    if (!row || !row.catalogPromoEnabled) return DEFAULT_CATALOG_PROMO;

    const fromRules = parseRulesJson(row.catalogPromoRules);
    if (fromRules) {
      return { ...fromRules, enabled: true };
    }

    return legacyFromRow(row);
  } catch {
    return DEFAULT_CATALOG_PROMO;
  }
}

export function catalogPromoRulesPayload(settings: CatalogPromoSettings): CatalogPromoRulesJson {
  return {
    mode: settings.mode,
    globalPercent: settings.mode === "global" ? settings.globalPercent : null,
    categoryPercents: settings.mode === "byCategory" ? settings.categoryPercents : {},
  };
}
