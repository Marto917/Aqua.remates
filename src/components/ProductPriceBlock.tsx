import { getStorePriceDisplay } from "@/lib/product-pricing-display";
import { getProductPromoDisplay } from "@/lib/product-promo";

type Props = {
  product: {
    listPrice: unknown;
    retailPrice: unknown;
    promoPrice?: unknown | null;
    showPromoBadge?: boolean;
    promoBadgePercent?: number | null;
  };
  size?: "card" | "detail";
  showMercadoPago?: boolean;
};

export function ProductPriceBlock({
  product,
  size = "card",
  showMercadoPago = false,
}: Props) {
  const { listFormatted, transferFormatted, mercadoPagoFormatted, listAmount, transferAmount } =
    getStorePriceDisplay(product);
  const promo = getProductPromoDisplay(product);
  const showListOnCard = listAmount > transferAmount + 0.01;
  const displayPrice = promo.showPromoPrice ? promo.promoPriceFormatted! : transferFormatted;
  const strikePrice = promo.showPromoPrice ? promo.normalTransferFormatted : null;

  if (size === "detail") {
    return (
      <div className="space-y-3 border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-end gap-6">
          {showListOnCard ? (
            <div className="order-1 w-full sm:order-none sm:w-auto">
              <p className="text-lg text-slate-500 sm:text-xl">{listFormatted}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Precio de lista
              </p>
            </div>
          ) : null}
          <div>
            {strikePrice ? (
              <p className="text-xl text-slate-400 line-through sm:text-2xl">{strikePrice}</p>
            ) : null}
            <p className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">{displayPrice}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">
              {promo.showPromoPrice ? "Precio promo con transferencia" : "Precio con transferencia"}
            </p>
          </div>
        </div>
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
      {showListOnCard ? (
        <p className="text-sm text-slate-500">{listFormatted}</p>
      ) : null}
      {strikePrice ? (
        <p className="text-sm text-slate-400 line-through">{strikePrice}</p>
      ) : null}
      <p className="text-lg font-bold text-brand sm:text-xl">{displayPrice}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
        Con transferencia
      </p>
    </div>
  );
}
