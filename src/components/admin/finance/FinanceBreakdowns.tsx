import { formatArs } from "@/lib/currency";
import type {
  FinanceBreakdownRow,
  FinanceTopCategory,
  FinanceTopProduct,
} from "@/lib/finance-stats";

function BreakdownList({
  title,
  rows,
}: {
  title: string;
  rows: FinanceBreakdownRow[];
}) {
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sin datos</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800">{r.label}</span>
                <span className="text-slate-700">{formatArs(r.revenue)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${Math.max(4, (r.revenue / max) * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{r.orders} pedido(s)</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RankList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-500">Solo ítems / categorías con ventas en el período</p>
      {empty ? (
        <p className="mt-3 text-sm text-slate-500">Sin ventas en el período</p>
      ) : (
        <ol className="mt-3 space-y-2">{children}</ol>
      )}
    </div>
  );
}

export function FinanceBreakdowns({
  byPayment,
  byBilling,
  byShipping,
  topProducts,
  topCategories,
}: {
  byPayment: FinanceBreakdownRow[];
  byBilling: FinanceBreakdownRow[];
  byShipping: FinanceBreakdownRow[];
  topProducts: FinanceTopProduct[];
  topCategories: FinanceTopCategory[];
}) {
  const maxCat = Math.max(...topCategories.map((c) => c.revenue), 1);
  const maxProd = Math.max(...topProducts.map((p) => p.revenue), 1);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <RankList title="Categorías que más venden" empty={topCategories.length === 0}>
          {topCategories.map((c, i) => (
            <li key={c.categoryId} className="border-b border-slate-50 pb-2 last:border-0">
              <div className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <span className="mr-2 text-xs font-bold text-slate-400">{i + 1}.</span>
                  <span className="font-medium text-slate-900">{c.name}</span>
                  <p className="ml-5 text-[11px] text-slate-500">
                    {c.units} u. · {c.productCount} artículo{c.productCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-slate-800">{formatArs(c.revenue)}</span>
              </div>
              <div className="mt-1.5 ml-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(4, (c.revenue / maxCat) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </RankList>

        <RankList title="Artículos que más se venden" empty={topProducts.length === 0}>
          {topProducts.map((p, i) => (
            <li key={p.productId + p.name} className="border-b border-slate-50 pb-2 last:border-0">
              <div className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <span className="mr-2 text-xs font-bold text-slate-400">{i + 1}.</span>
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <p className="ml-5 text-[11px] text-slate-500">
                    {p.units} u.
                    {p.categoryName ? ` · ${p.categoryName}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-slate-800">{formatArs(p.revenue)}</span>
              </div>
              <div className="mt-1.5 ml-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.max(4, (p.revenue / maxProd) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </RankList>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <BreakdownList title="Por método de pago" rows={byPayment} />
        <BreakdownList title="Por facturación" rows={byBilling} />
        <BreakdownList title="Por envío" rows={byShipping} />
      </div>
    </div>
  );
}
