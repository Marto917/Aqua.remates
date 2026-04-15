/**
 * Regla de negocio (v1): el precio mayorista aplica cuando hay
 * al menos 2 unidades del mismo producto en el carrito (mismo `productId`).
 * Variantes de color: si son filas distintas en catálogo, conviene que compartan `productId`
 * o un modelo de variantes; mientras tanto, "mismo ítem" = mismo id de producto.
 */
export const MIN_UNITS_FOR_WHOLESALE_PRICE = 2;

export function wholesalePriceAppliesForLine(quantity: number): boolean {
  return quantity >= MIN_UNITS_FOR_WHOLESALE_PRICE;
}

export type CartLine = { productId: string; quantity: number };

/** Devuelve productIds cuyas líneas califican para precio mayorista. */
export function productIdsEligibleForWholesale(lines: CartLine[]): Set<string> {
  const eligible = new Set<string>();
  for (const line of lines) {
    if (wholesalePriceAppliesForLine(line.quantity)) {
      eligible.add(line.productId);
    }
  }
  return eligible;
}
