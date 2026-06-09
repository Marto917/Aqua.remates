import { prisma } from "@/lib/prisma";

export type FreeShippingCategoryMode = "all" | "selected";

export type FreeShippingSettings = {
  enabled: boolean;
  /** Envío gratis si el subtotal supera este monto. */
  minOrderEnabled: boolean;
  minOrderAmount: number | null;
  /** Envío gratis por categorías del carrito. */
  categoryFreeEnabled: boolean;
  categoryMode: FreeShippingCategoryMode;
  categoryIds: string[];
};

export const DEFAULT_FREE_SHIPPING: FreeShippingSettings = {
  enabled: false,
  minOrderEnabled: false,
  minOrderAmount: null,
  categoryFreeEnabled: false,
  categoryMode: "all",
  categoryIds: [],
};

type FreeShippingRulesJson = {
  minOrderEnabled?: boolean;
  minOrderAmount?: number | null;
  categoryFreeEnabled?: boolean;
  categoryMode?: FreeShippingCategoryMode;
  categoryIds?: string[];
};

function parseCategoryIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function parseRulesJson(raw: unknown): FreeShippingSettings | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rules = raw as FreeShippingRulesJson;
  const minOrderAmount =
    typeof rules.minOrderAmount === "number" && rules.minOrderAmount > 0
      ? Math.round(rules.minOrderAmount)
      : null;

  return {
    enabled: true,
    minOrderEnabled: Boolean(rules.minOrderEnabled),
    minOrderAmount,
    categoryFreeEnabled: Boolean(rules.categoryFreeEnabled),
    categoryMode: rules.categoryMode === "selected" ? "selected" : "all",
    categoryIds: parseCategoryIds(rules.categoryIds),
  };
}

export async function getFreeShippingSettings(): Promise<FreeShippingSettings> {
  try {
    const row = await prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { freeShippingRules: true },
    });
    if (!row?.freeShippingRules) return DEFAULT_FREE_SHIPPING;
    const parsed = parseRulesJson(row.freeShippingRules);
    return parsed ?? DEFAULT_FREE_SHIPPING;
  } catch {
    return DEFAULT_FREE_SHIPPING;
  }
}

export function freeShippingRulesPayload(settings: FreeShippingSettings): FreeShippingRulesJson {
  return {
    minOrderEnabled: settings.minOrderEnabled,
    minOrderAmount: settings.minOrderEnabled ? settings.minOrderAmount : null,
    categoryFreeEnabled: settings.categoryFreeEnabled,
    categoryMode: settings.categoryMode,
    categoryIds: settings.categoryMode === "selected" ? settings.categoryIds : [],
  };
}

export function qualifiesForFreeShipping(
  settings: FreeShippingSettings,
  subtotalAmount: number,
  cartCategoryIds: string[],
): { free: boolean; reason: string | null } {
  if (!settings.enabled) {
    return { free: false, reason: null };
  }

  if (
    settings.minOrderEnabled &&
    settings.minOrderAmount != null &&
    subtotalAmount >= settings.minOrderAmount
  ) {
    return {
      free: true,
      reason: `Compra desde $${settings.minOrderAmount.toLocaleString("es-AR")}`,
    };
  }

  if (settings.categoryFreeEnabled) {
    if (settings.categoryMode === "all") {
      return { free: true, reason: "Promo envío gratis en el catálogo" };
    }
    const qualifying = settings.categoryIds.filter((id) => cartCategoryIds.includes(id));
    if (qualifying.length > 0) {
      return { free: true, reason: "Promo envío gratis por categoría" };
    }
  }

  return { free: false, reason: null };
}
