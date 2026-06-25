import { formatArs } from "@/lib/currency";
import {
  type CatalogPromoSettings,
  DEFAULT_CATALOG_PROMO,
} from "@/lib/catalog-promo";
import { getListPrice, getMercadoPagoPrice, getTransferPrice } from "@/lib/store-pricing";

export type ProductPriceDisplay = {
  listFormatted: string;
  transferFormatted: string;
  mercadoPagoFormatted: string;
  showListAndTransfer: boolean;
  listAmount: number;
  transferAmount: number;
};

type ProductPricingFields = {
  listPrice: unknown;
  categoryId?: string | null;
};

export function getStorePriceDisplay(
  product: ProductPricingFields,
  catalogPromo: CatalogPromoSettings = DEFAULT_CATALOG_PROMO,
): ProductPriceDisplay {
  const listAmount = getListPrice(product);
  const transferAmount = getTransferPrice(product, catalogPromo);
  const showListAndTransfer = listAmount > transferAmount + 0.01;

  return {
    listFormatted: formatArs(listAmount),
    transferFormatted: formatArs(transferAmount),
    mercadoPagoFormatted: formatArs(getMercadoPagoPrice(product)),
    showListAndTransfer,
    listAmount,
    transferAmount,
  };
}
