import Link from "next/link";
import type { FinanceFilters, FinancePreset } from "@/lib/finance-stats";
import { financeFiltersToQuery } from "@/lib/finance-stats";
import {
  retailOrderStatusLabel,
  retailPaymentMethodLabel,
  retailShippingMethodLabel,
} from "@/lib/order-labels";

const PRESETS: { key: FinancePreset; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "mes", label: "Este mes" },
  { key: "todo", label: "Todo" },
];

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function qs(filters: FinanceFilters, overrides: Partial<Record<string, string>> = {}): string {
  const merged: Record<string, string> = { ...financeFiltersToQuery({ ...filters, page: 1 }) };
  for (const [k, v] of Object.entries(overrides)) {
    if (v != null && v !== "") merged[k] = v;
  }
  if (overrides.preset && overrides.preset !== "custom") {
    delete merged.from;
    delete merged.to;
  }
  const params = new URLSearchParams(merged);
  const s = params.toString();
  return s ? `?${s}` : "";
}

type Props = {
  filters: FinanceFilters;
};

export function FinanceFiltersBar({ filters }: Props) {
  const exportQs = new URLSearchParams(financeFiltersToQuery(filters)).toString();

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Período</span>
        {PRESETS.map((p) => {
          const active = filters.preset === p.key;
          return (
            <Link
              key={p.key}
              href={`/admin/finanzas${qs(filters, { preset: p.key })}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                active
                  ? "bg-brand-dark text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
        <a
          href={`/api/admin/finance/export${exportQs ? `?${exportQs}` : ""}`}
          className="ml-auto inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Exportar CSV
        </a>
      </div>

      <form method="get" action="/admin/finanzas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input type="hidden" name="preset" value="custom" />
        <label className="block text-xs font-medium text-slate-600">
          Desde
          <input
            type="date"
            name="from"
            defaultValue={toDateInput(filters.from)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Hasta
          <input
            type="date"
            name="to"
            defaultValue={toDateInput(filters.to)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Pago
          <select
            name="payment"
            defaultValue={filters.paymentMethod ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(retailPaymentMethodLabel).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Estado
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(retailOrderStatusLabel).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Facturación
          <select
            name="billing"
            defaultValue={filters.billingMode ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            <option value="NEGRO">Negro</option>
            <option value="BLANCO">Blanco</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Envío
          <select
            name="shipping"
            defaultValue={filters.shippingMethod ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(retailShippingMethodLabel).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button
            type="submit"
            className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Aplicar filtros
          </button>
          <Link
            href="/admin/finanzas?preset=30d"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpiar
          </Link>
        </div>
      </form>
    </div>
  );
}
