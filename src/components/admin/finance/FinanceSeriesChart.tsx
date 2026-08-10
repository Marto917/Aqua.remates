import { formatArs } from "@/lib/currency";
import type { FinanceSeriesPoint } from "@/lib/finance-stats";

type Props = {
  series: FinanceSeriesPoint[];
};

export function FinanceSeriesChart({ series }: Props) {
  if (series.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No hay ventas en este período para graficar.
      </div>
    );
  }

  const max = Math.max(...series.map((s) => s.revenue), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Ingresos en el tiempo</h2>
      <p className="mt-0.5 text-xs text-slate-500">Solo pedidos confirmados / pago aprobado</p>
      <div className="mt-4 flex h-44 items-end gap-1 overflow-x-auto pb-1">
        {series.map((p) => {
          const px = Math.max(4, Math.round((p.revenue / max) * 140));
          return (
            <div
              key={p.key}
              className="group flex min-w-[1.5rem] flex-1 flex-col items-center justify-end"
              title={`${p.label}: ${formatArs(p.revenue)} · ${p.orders} venta(s)`}
            >
              <div
                className="w-full max-w-[2rem] rounded-t bg-brand-dark/80 transition group-hover:bg-brand-dark"
                style={{ height: `${px}px` }}
              />
              <span className="mt-1 max-w-[2.5rem] truncate text-[9px] text-slate-500">{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
