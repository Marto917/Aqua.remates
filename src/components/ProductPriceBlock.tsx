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
      <p
        className={
          size === "detail"
            ? "text-3xl font-bold text-brand"
            : "text-lg font-bold text-brand sm:text-xl"
        }
      >
        {main}
      </p>
    );
  }

  const { listFormatted, cashFormatted, showListAndCash, discountPercent } =
    getRetailPriceDisplay(product);

  if (size === "detail") {
    return (
      <div className="flex flex-wrap items-end gap-6 border-b border-slate-100 pb-5">
        <div>
          <p className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">{cashFormatted}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">
            Precio en efectivo
            {discountPercent > 0 ? ` · ${discountPercent}% off` : ""}
          </p>
        </div>
        {showListAndCash ? (
          <div className="text-right">
            <p className="text-lg text-slate-500 line-through sm:text-xl">{listFormatted}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Precio de lista
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {showListAndCash ? (
        <p className="text-xs text-slate-500 line-through">{listFormatted}</p>
      ) : null}
      <p className="text-lg font-bold text-brand sm:text-xl">{cashFormatted}</p>
      {showListAndCash ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
          En efectivo{discountPercent > 0 ? ` · ${discountPercent}%` : ""}
        </p>
      ) : null}
    </div>
  );
}
