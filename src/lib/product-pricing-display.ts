import { formatArs } from "@/lib/currency";
import { getListPrice, getMercadoPagoPrice, getTransferPrice } from "@/lib/store-pricing";

export type ProductPriceDisplay = {
  listFormatted: string;
  transferFormatted: string;
  mercadoPagoFormatted: string;
  showListAndTransfer: boolean;
  listAmount: number;
  transferAmount: number;
};

export function getStorePriceDisplay(product: ProductPricingFields): ProductPriceDisplay {
  const transferAmount = getTransferPrice(product);
  const listAmount = getListPrice(product);
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

type ProductPricingFields = {
  listPrice: unknown;
  retailPrice: unknown;
};
