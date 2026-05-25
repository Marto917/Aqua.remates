import { getStorePriceDisplay } from "@/lib/product-pricing-display";
import type { StoreSettingsData } from "@/lib/store-settings";

type Props = {
  product: {
    listPrice: unknown;
    retailPrice: unknown;
    discountRetailPercent: number;
  };
  settings: Pick<StoreSettingsData, "mercadoPagoMarkupPercent">;
  size?: "card" | "detail";
  showMercadoPago?: boolean;
};

export function ProductPriceBlock({
  product,
  settings,
  size = "card",
  showMercadoPago = false,
}: Props) {
  const { listFormatted, transferFormatted, mercadoPagoFormatted, showListAndTransfer } =
    getStorePriceDisplay(product, settings);

  if (size === "detail") {
    return (
      <div className="space-y-3 border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              {transferFormatted}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">
              Precio con transferencia
            </p>
          </div>
          {showListAndTransfer ? (
            <div>
              <p className="text-base text-slate-500 sm:text-lg">{listFormatted}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Precio de lista
              </p>
            </div>
          ) : null}
        </div>
        {showMercadoPago ? (
          <p className="text-sm text-slate-600">
            Con Mercado Pago: <span className="font-semibold text-slate-800">{mercadoPagoFormatted}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {showListAndTransfer ? (
        <p className="text-xs text-slate-500">{listFormatted}</p>
      ) : null}
      <p className="text-lg font-bold text-brand sm:text-xl">{transferFormatted}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
        Con transferencia
      </p>
    </div>
  );
}
