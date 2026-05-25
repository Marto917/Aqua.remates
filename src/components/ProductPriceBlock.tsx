import {
  getRetailPriceDisplay,
  getWholesalePriceDisplay,
} from "@/lib/product-pricing-display";
import type { PriceMode } from "@/lib/catalog-pricing";

type Props = {
  product: {
    listPrice: unknown;
    retailPrice: unknown;
    wholesalePrice: unknown;
    discountRetailPercent: number;
    discountWholesalePercent: number;
  };
  mode: PriceMode;
  size?: "card" | "detail";
};

export function ProductPriceBlock({ product, mode, size = "card" }: Props) {
  if (mode === "wholesale") {
    const { main } = getWholesalePriceDisplay(product);
    return (
      <p className={size === "detail" ? "text-2xl font-bold text-brand-dark" : "text-base font-bold text-brand-dark sm:text-lg"}>
        {main}
      </p>
    );
  }

  const { listFormatted, cashFormatted, showListAndCash, discountPercent } =
    getRetailPriceDisplay(product);

  if (!showListAndCash) {
    return (
      <p
        className={
          size === "detail"
            ? "text-3xl font-bold text-brand"
            : "text-xl font-bold text-brand sm:text-2xl"
        }
      >
        {cashFormatted}
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        Precio de lista
      </p>
      <p
        className={
          size === "detail"
            ? "text-xl font-semibold text-slate-700 line-through decoration-slate-400/80 sm:text-2xl"
            : "text-base font-semibold text-slate-600 sm:text-lg"
        }
      >
        {listFormatted}
      </p>
      <p
        className={
          size === "detail"
            ? "mt-1 text-3xl font-bold leading-none text-brand sm:text-4xl"
            : "text-xl font-bold leading-none text-brand sm:text-2xl"
        }
      >
        {cashFormatted}
      </p>
      <p className="text-[11px] text-slate-600 sm:text-xs">
        En efectivo{discountPercent > 0 ? ` (${discountPercent}% off)` : ""}
      </p>
    </div>
  );
}
