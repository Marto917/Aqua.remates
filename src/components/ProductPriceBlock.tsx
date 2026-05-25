import { getStorePriceDisplay } from "@/lib/product-pricing-display";

type Props = {
  product: {
    listPrice: unknown;
    retailPrice: unknown;
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
  const showListOnCard = listAmount > transferAmount + 0.01;

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
            <p className="text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              {transferFormatted}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">
              Precio con transferencia
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
      <p className="text-lg font-bold text-brand sm:text-xl">{transferFormatted}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
        Con transferencia
      </p>
    </div>
  );
}
