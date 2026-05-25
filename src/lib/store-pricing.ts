export type ProductPricingFields = {
  listPrice: unknown;
  retailPrice: unknown;
};

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Precio con transferencia bancaria (campo retailPrice). */
export function getTransferPrice(product: ProductPricingFields): number {
  const transfer = Number(product.retailPrice);
  if (Number.isFinite(transfer) && transfer > 0) return roundMoney(transfer);
  const list = Number(product.listPrice);
  if (Number.isFinite(list) && list > 0) return roundMoney(list);
  return 0;
}

/** Precio de lista / Mercado Pago (campo listPrice). */
export function getListPrice(product: ProductPricingFields): number {
  const list = Number(product.listPrice);
  if (Number.isFinite(list) && list > 0) return roundMoney(list);
  return getTransferPrice(product);
}

/** Mercado Pago cobra el precio de lista. */
export function getMercadoPagoPrice(product: ProductPricingFields): number {
  return getListPrice(product);
}
