"use client";

import { useStoreSettings } from "@/contexts/store-settings-context";
import { getStorePriceDisplay } from "@/lib/product-pricing-display";
import { getProductPromoDisplay } from "@/lib/product-promo";

type Props = {
  product: {
    listPrice: unknown;
    categoryId?: string | null;
  };
  size?: "card" | "detail";
  showMercadoPago?: boolean;
};

function PriceColumn({
  amount,
  label,
  size,
}: {
  amount: string;
  label: string;
  size: "card" | "detail";
}) {
  const amountClass =
    size === "detail"
      ? "text-2xl font-bold text-slate-900 sm:text-3xl"
      : "text-base font-bold text-slate-800 sm:text-lg";

  const labelClass =
    size === "detail"
      ? "mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500"
      : "text-[10px] font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div
      className={
        size === "detail"
          ? "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"
          : "rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center"
      }
    >
      <p className={amountClass}>{amount}</p>
      <p className={labelClass}>{label}</p>
    </div>
  );
}

export function ProductPriceBlock({
  product,
  size = "card",
  showMercadoPago = false,
}: Props) {
  const settings = useStoreSettings();
  const { listFormatted, transferFormatted, mercadoPagoFormatted, showListAndTransfer } =
    getStorePriceDisplay(product, settings.catalogPromo);
  const promo = getProductPromoDisplay(product, settings.catalogPromo);
  const displayPrice = promo.showPromoPrice ? promo.promoPriceFormatted! : transferFormatted;
  const strikeTransfer = promo.showPromoPrice ? promo.normalTransferFormatted : null;
  const transferLabel = promo.showPromoPrice ? "Promo transferencia" : "Con transferencia";

  const pricesRow = (
    <div
      className={
        size === "detail"
          ? "flex flex-wrap items-stretch justify-start gap-4 sm:gap-6"
          : "flex flex-wrap items-stretch justify-center gap-3"
      }
    >
      {showListAndTransfer ? (
        <PriceColumn amount={listFormatted} label="Precio de lista" size={size} />
      ) : null}
      <div className="text-center">
        {strikeTransfer ? (
          <p
            className={
              size === "detail"
                ? "text-lg text-slate-400 line-through sm:text-xl"
                : "text-sm text-slate-400 line-through"
            }
          >
            {strikeTransfer}
          </p>
        ) : null}
        <p
          className={
            size === "detail"
              ? showListAndTransfer
                ? "text-2xl font-bold text-brand sm:text-3xl"
                : "text-2xl font-bold text-slate-900 sm:text-3xl"
              : showListAndTransfer
                ? "text-base font-bold text-brand sm:text-lg"
                : "text-base font-bold text-slate-800 sm:text-lg"
          }
        >
          {displayPrice}
        </p>
        <p
          className={
            size === "detail"
              ? "mt-1 text-xs font-semibold uppercase tracking-wider text-brand-dark"
              : "text-[10px] font-semibold uppercase tracking-wide text-brand-dark"
          }
        >
          {transferLabel}
        </p>
      </div>
    </div>
  );

  if (size === "detail") {
    return (
      <div className="space-y-3 border-b border-slate-100 pb-5">
        {pricesRow}
        {showMercadoPago ? (
          <p className="text-sm text-slate-600">
            Con Mercado Pago: <span className="font-semibold text-slate-800">{mercadoPagoFormatted}</span>
            <span className="text-slate-500"> (precio de lista)</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {pricesRow}
    </div>
  );
}
