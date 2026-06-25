import { MIN_UNITS_FOR_WHOLESALE_PRICE } from "@/lib/pricing-constants";

export type PriceMode = "retail" | "wholesale";

export type CatalogFilters = {
  q?: string;
  category?: string;
  priceMode?: PriceMode;
  minPrice?: number;
  maxPrice?: number;
};

export function getFinalUnitPrice(
  product: {
    wholesalePrice: unknown;
    discountWholesalePercent: number;
    listPrice?: unknown;
  },
  mode: PriceMode,
) {
  if (mode === "retail") {
    return Number(product.listPrice ?? 0);
  }
  const base = Number(product.wholesalePrice);
  const pct = product.discountWholesalePercent;
  return base * (1 - Math.min(100, Math.max(0, pct)) / 100);
}

export function getProductDisplayPrice(
  product: Parameters<typeof getFinalUnitPrice>[0],
  mode: PriceMode,
) {
  return getFinalUnitPrice(product, mode).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export function getDiscountPercentForMode(
  product: { discountWholesalePercent: number },
  mode: PriceMode,
) {
  return mode === "wholesale" ? product.discountWholesalePercent : 0;
}

/** Texto de precio en grilla: en modo mayorista muestra referencia mayorista + aclaración de regla. */
export function getListingPriceLabel(
  product: Parameters<typeof getProductDisplayPrice>[0],
  catalogMode: PriceMode,
): { main: string; hint?: string } {
  if (catalogMode === "retail") {
    return { main: getProductDisplayPrice(product, "retail") };
  }
  return {
    main: getProductDisplayPrice(product, "wholesale"),
    hint: `Precio mayorista si llevás ${MIN_UNITS_FOR_WHOLESALE_PRICE}+ unidades del mismo producto (entre colores).`,
  };
}
