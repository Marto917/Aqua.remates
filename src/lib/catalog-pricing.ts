import { MIN_UNITS_FOR_WHOLESALE_PRICE } from "@/lib/pricing-constants";

export type PriceMode = "retail" | "wholesale";

export type CatalogFilters = {
  q?: string;
  category?: string;
  priceMode?: PriceMode;
};

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
