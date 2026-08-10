import { formatArs } from "@/lib/currency";

type Kpi = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "muted";
};

function toneClass(tone: Kpi["tone"]) {
  if (tone === "good") return "border-emerald-200 bg-emerald-50/60";
  if (tone === "warn") return "border-amber-200 bg-amber-50/60";
  if (tone === "muted") return "border-slate-200 bg-slate-50";
  return "border-slate-200 bg-white";
}

type Props = {
  revenue: number;
  salesCount: number;
  avgTicket: number;
  pendingCount: number;
  pendingAmount: number;
  cancelledCount: number;
  shippingCollected: number;
  promoDiscounts: number;
  revenueDeltaPct: number | null;
  salesDeltaPct: number | null;
};

function formatDelta(pct: number | null): string | undefined {
  if (pct == null) return "Sin base previa";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% vs período anterior`;
}

export function FinanceKpiGrid({
  revenue,
  salesCount,
  avgTicket,
  pendingCount,
  pendingAmount,
  cancelledCount,
  shippingCollected,
  promoDiscounts,
  revenueDeltaPct,
  salesDeltaPct,
}: Props) {
  const items: Kpi[] = [
    {
      label: "Ingresos",
      value: formatArs(revenue),
      hint: formatDelta(revenueDeltaPct),
      tone: "good",
    },
    {
      label: "Ventas",
      value: String(salesCount),
      hint: formatDelta(salesDeltaPct),
    },
    {
      label: "Ticket promedio",
      value: formatArs(avgTicket),
    },
    {
      label: "Pendientes de cobro",
      value: `${pendingCount}`,
      hint: pendingCount > 0 ? formatArs(pendingAmount) : "Sin pendientes",
      tone: pendingCount > 0 ? "warn" : "muted",
    },
    {
      label: "Cancelados",
      value: String(cancelledCount),
      tone: cancelledCount > 0 ? "warn" : "muted",
    },
    {
      label: "Envíos cobrados",
      value: formatArs(shippingCollected),
    },
    {
      label: "Descuentos promo",
      value: formatArs(promoDiscounts),
      tone: "muted",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((k) => (
        <article
          key={k.label}
          className={`rounded-xl border p-4 shadow-sm ${toneClass(k.tone)}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{k.value}</p>
          {k.hint ? <p className="mt-1 text-xs text-slate-600">{k.hint}</p> : null}
        </article>
      ))}
    </div>
  );
}
