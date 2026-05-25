import { formatArs } from "@/lib/currency";
import { getFinalUnitPrice, type PriceMode } from "@/lib/catalog-pricing";

export type ProductPriceDisplay = {
  listFormatted: string;
  cashFormatted: string;
  showListAndCash: boolean;
  discountPercent: number;
  listAmount: number;
  cashAmount: number;
};

/** Minorista: siempre mostrar lista si existe; precio efectivo destacado. */
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
  const listAmount = Number.isFinite(list) && list > 0 ? list : cash;
  const showListAndCash = listAmount > cash + 0.01 || discountPercent > 0;

  return {
    listFormatted: formatArs(listAmount),
    cashFormatted: formatArs(cash),
    showListAndCash,
    discountPercent,
    listAmount,
    cashAmount: cash,
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

export function retailDiscountBadgePercent(product: {
  listPrice: unknown;
  retailPrice: unknown;
  discountRetailPercent: number;
}): number | null {
  const { discountPercent, listAmount, cashAmount, showListAndCash } =
    getRetailPriceDisplay(product);
  if (!showListAndCash) return null;
  if (discountPercent > 0) return discountPercent;
  if (listAmount <= cashAmount) return null;
  return Math.round((1 - cashAmount / listAmount) * 100);
}
