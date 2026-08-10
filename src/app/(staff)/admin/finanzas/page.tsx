import Link from "next/link";
import { redirect } from "next/navigation";
import { FinanceBreakdowns } from "@/components/admin/finance/FinanceBreakdowns";
import { FinanceFiltersBar } from "@/components/admin/finance/FinanceFiltersBar";
import { FinanceKpiGrid } from "@/components/admin/finance/FinanceKpiGrid";
import { FinanceOrdersTable } from "@/components/admin/finance/FinanceOrdersTable";
import { FinanceSeriesChart } from "@/components/admin/finance/FinanceSeriesChart";
import { formatArs } from "@/lib/currency";
import { loadFinanceDashboard } from "@/lib/finance-stats";
import { getStaffContext, isOwnerAccess } from "@/lib/staff-auth";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FinanzasPage({ searchParams }: PageProps) {
  const ctx = await getStaffContext();
  if (!isOwnerAccess(ctx)) {
    redirect("/admin");
  }

  const params = await searchParams;
  let data;
  try {
    data = await loadFinanceDashboard(params);
  } catch (e) {
    console.error("FinanzasPage:", e);
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        <h1 className="text-lg font-semibold">No se pudieron cargar las finanzas</h1>
        <p className="mt-2">Revisá la conexión a la base o intentá de nuevo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Finanzas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Ventas reales del período · {data.rangeLabel}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Los ingresos incluyen pedidos confirmados y pagos aprobados de Mercado Pago. Los
            pendientes se muestran aparte.
          </p>
        </div>
      </header>

      <FinanceFiltersBar filters={data.filters} />

      <FinanceKpiGrid
        revenue={data.revenue}
        salesCount={data.salesCount}
        avgTicket={data.avgTicket}
        pendingCount={data.pendingCount}
        pendingAmount={data.pendingAmount}
        cancelledCount={data.cancelledCount}
        shippingCollected={data.shippingCollected}
        promoDiscounts={data.promoDiscounts}
        revenueDeltaPct={data.previous.revenueDeltaPct}
        salesDeltaPct={data.previous.salesDeltaPct}
      />

      <FinanceSeriesChart series={data.series} />

      <FinanceBreakdowns
        byPayment={data.byPayment}
        byBilling={data.byBilling}
        byShipping={data.byShipping}
        topProducts={data.topProducts}
        topCategories={data.topCategories}
      />

      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-violet-950">Mayorista (confirmado)</h2>
            <p className="mt-1 text-sm text-violet-900/80">
              {data.wholesale.count} solicitud(es) · total estimado{" "}
              <strong>{formatArs(data.wholesale.total)}</strong>
            </p>
            <p className="mt-1 text-xs text-violet-800/70">
              No se mezcla con el KPI de ingresos minoristas.
            </p>
          </div>
          <Link
            href="/admin/mayoristas"
            className="rounded-full border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100"
          >
            Ver mayoristas
          </Link>
        </div>
      </div>

      <FinanceOrdersTable
        filters={data.filters}
        orders={data.orders}
        ordersTotal={data.ordersTotal}
        pageSize={data.pageSize}
      />
    </div>
  );
}
