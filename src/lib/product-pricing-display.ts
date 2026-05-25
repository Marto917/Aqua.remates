import { formatArs } from "@/lib/currency";
import { getFinalUnitPrice, type PriceMode } from "@/lib/catalog-pricing";

export type ProductPriceDisplay = {
  listFormatted: string;
  cashFormatted: string;
  showListAndCash: boolean;
  discountPercent: number;
};

/** Minorista: precio de lista grande + precio en efectivo con descuento. */
export function getRetailPriceDisplay(product: {
  listPrice: unknown;
  retailPrice: unknown;
  discountRetailPercent: number;
}): ProductPriceDisplay {
  const list = Number(product.listPrice);
  const cash = getFinalUnitPrice(
    {
      retailPrice: product.retailPrice,
      wholesalePrice: product.retailPrice,
      discountRetailPercent: product.discountRetailPercent,
      discountWholesalePercent: 0,
    },
    "retail",
  );
  const discountPercent = Math.min(100, Math.max(0, product.discountRetailPercent));
  const showListAndCash = discountPercent > 0 && list > cash;

  return {
    listFormatted: formatArs(list),
    cashFormatted: formatArs(cash),
    showListAndCash,
    discountPercent,
  };
}

export function getWholesalePriceDisplay(product: {
  wholesalePrice: unknown;
  discountWholesalePercent: number;
}): { main: string; hint?: string } {
  const cash = getFinalUnitPrice(
    {
      retailPrice: product.wholesalePrice,
      wholesalePrice: product.wholesalePrice,
      discountRetailPercent: 0,
      discountWholesalePercent: product.discountWholesalePercent,
    },
    "wholesale",
  );
  return { main: formatArs(cash) };
}
