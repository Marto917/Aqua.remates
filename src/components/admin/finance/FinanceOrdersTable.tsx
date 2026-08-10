import Link from "next/link";
import { formatArs } from "@/lib/currency";
import type { FinanceFilters, FinanceOrderRow } from "@/lib/finance-stats";
import { financeFiltersToQuery } from "@/lib/finance-stats";
import {
  retailOrderStatusLabel,
  retailPaymentMethodLabel,
} from "@/lib/order-labels";

type Props = {
  filters: FinanceFilters;
  orders: FinanceOrderRow[];
  ordersTotal: number;
  pageSize: number;
};

export function FinanceOrdersTable({ filters, orders, ordersTotal, pageSize }: Props) {
  const totalPages = Math.max(1, Math.ceil(ordersTotal / pageSize));
  const page = filters.page;

  function pageHref(p: number) {
    const q = financeFiltersToQuery({ ...filters, page: p });
    const s = new URLSearchParams(q).toString();
    return `/admin/finanzas${s ? `?${s}` : ""}`;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Pedidos del período</h2>
          <p className="text-xs text-slate-500">{ordersTotal} resultado(s)</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Pago</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay pedidos con estos filtros.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                    {o.createdAt.toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{o.buyerName}</div>
                    <div className="text-xs text-slate-500">{o.buyerEmail}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {retailPaymentMethodLabel[o.paymentMethod]}
                    <div className="text-[11px] text-slate-500">{o.billingMode}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {retailOrderStatusLabel[o.status]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-slate-900">
                    {formatArs(o.totalAmount)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="text-xs font-medium text-brand-dark underline-offset-2 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50"
              >
                Anterior
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50"
              >
                Siguiente
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
