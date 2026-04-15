import type { PriceMode } from "@/lib/catalog";
import { MIN_UNITS_FOR_WHOLESALE_PRICE } from "@/lib/pricing-constants";

export { MIN_UNITS_FOR_WHOLESALE_PRICE };

export type CartLineForTotals = { productId: string; quantity: number };

/** Cantidad total por producto (suma todos los colores / variantes). */
export function quantityByProductId(lines: CartLineForTotals[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    map.set(line.productId, (map.get(line.productId) ?? 0) + line.quantity);
  }
  return map;
}

/** Si el carrito está en mayorista, este producto usa precio mayorista solo si hay 2+ unidades del mismo producto en total. */
export function getEffectivePriceModeForProduct(
  cartMode: PriceMode,
  productId: string,
  totals: Map<string, number>,
): PriceMode {
  if (cartMode === "retail") return "retail";
  const n = totals.get(productId) ?? 0;
  return n >= MIN_UNITS_FOR_WHOLESALE_PRICE ? "wholesale" : "retail";
}
