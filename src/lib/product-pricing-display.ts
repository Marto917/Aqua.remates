import { formatArs } from "@/lib/currency";
import {
  getListPrice,
  getMercadoPagoPrice,
  getTransferPrice,
  shouldShowDiscountBadge,
} from "@/lib/store-pricing";

export type ProductPriceDisplay = {
  listFormatted: string;
  transferFormatted: string;
  mercadoPagoFormatted: string;
  showListAndTransfer: boolean;
  discountPercent: number;
  listAmount: number;
  transferAmount: number;
};

export function getStorePriceDisplay(
  product: {
    listPrice: unknown;
    retailPrice: unknown;
    discountRetailPercent: number;
  },
  settings: { mercadoPagoMarkupPercent: number },
): ProductPriceDisplay {
  const transferAmount = getTransferPrice(product);
  const listAmount = getListPrice(product);
  const discountPercent = Math.min(100, Math.max(0, product.discountRetailPercent ?? 15));
  const showListAndTransfer = listAmount > transferAmount + 0.01;

  return {
    listFormatted: formatArs(listAmount),
    transferFormatted: formatArs(transferAmount),
    mercadoPagoFormatted: formatArs(
      getMercadoPagoPrice(product, settings.mercadoPagoMarkupPercent),
    ),
    showListAndTransfer,
    discountPercent,
    listAmount,
    transferAmount,
  };
}

export function getDiscountBadgeLabel(
  product: { discountBadgeLabel?: string | null },
  settings: { discountBadgeLabel: string },
): string {
  return product.discountBadgeLabel?.trim() || settings.discountBadgeLabel;
}

export { shouldShowDiscountBadge };
