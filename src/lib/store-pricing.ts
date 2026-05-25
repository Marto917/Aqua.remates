/** Lista = transferencia × (1 + LIST_MARKUP). */
export const LIST_MARKUP = 0.15;

export type ProductPricingFields = {
  listPrice: unknown;
  retailPrice: unknown;
  discountRetailPercent: number;
};

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Precio transferencia (base de venta). */
export function getTransferPrice(product: ProductPricingFields): number {
  const fromRetail = Number(product.retailPrice);
  if (Number.isFinite(fromRetail) && fromRetail > 0) {
    return fromRetail;
  }
  const list = Number(product.listPrice);
  const pct = Math.min(100, Math.max(0, product.discountRetailPercent ?? 15));
  return roundMoney(list * (1 - pct / 100));
}

/** Precio de lista mostrado en tienda. */
export function getListPrice(product: ProductPricingFields): number {
  const list = Number(product.listPrice);
  if (Number.isFinite(list) && list > 0) return list;
  return roundMoney(getTransferPrice(product) * (1 + LIST_MARKUP));
}

export function listPriceFromTransfer(transfer: number): number {
  return roundMoney(transfer * (1 + LIST_MARKUP));
}

export function getMercadoPagoPrice(
  product: ProductPricingFields,
  markupPercent: number,
): number {
  const transfer = getTransferPrice(product);
  const pct = Math.min(100, Math.max(0, markupPercent));
  return roundMoney(transfer * (1 + pct / 100));
}

export function shouldShowDiscountBadge(discountPercent: number): boolean {
  return discountPercent > 0;
}
