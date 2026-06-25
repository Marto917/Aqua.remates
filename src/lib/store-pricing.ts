import {
  type CatalogPromoSettings,
  DEFAULT_CATALOG_PROMO,
  getProductCatalogPromoPercent,
} from "@/lib/catalog-promo";

export type ProductPricingFields = {
  listPrice: unknown;
  categoryId?: string | null;
};

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Precio de lista / Mercado Pago. */
export function getListPrice(product: Pick<ProductPricingFields, "listPrice">): number {
  const list = Number(product.listPrice);
  if (Number.isFinite(list) && list > 0) return roundMoney(list);
  return 0;
}

/** Precio transferencia = lista con descuento de promoción de catálogo (si aplica). */
export function getTransferPrice(
  product: ProductPricingFields,
  catalogPromo: CatalogPromoSettings = DEFAULT_CATALOG_PROMO,
): number {
  const list = getListPrice(product);
  if (list <= 0) return 0;
  const pct = getProductCatalogPromoPercent(product.categoryId, catalogPromo);
  if (pct == null) return list;
  return roundMoney(list * (1 - pct / 100));
}

/** Mercado Pago cobra el precio de lista. */
export function getMercadoPagoPrice(product: Pick<ProductPricingFields, "listPrice">): number {
  return getListPrice(product);
}
