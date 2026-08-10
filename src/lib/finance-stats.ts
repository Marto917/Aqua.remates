import type {
  BillingMode,
  Prisma,
  RetailOrderStatus,
  RetailPaymentMethod,
  RetailShippingMethod,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Pedidos que cuentan como ingreso / venta cerrada. */
export const FINANCE_REVENUE_STATUSES: RetailOrderStatus[] = [
  "CONFIRMED",
  "PAYMENT_APPROVED",
];

export const FINANCE_PENDING_STATUSES: RetailOrderStatus[] = [
  "PENDING_TRANSFER",
  "TRANSFER_REPORTED",
  "PENDING_PAYMENT",
];

export type FinancePreset = "hoy" | "7d" | "30d" | "mes" | "todo" | "custom";

export type FinanceFilters = {
  preset: FinancePreset;
  from: Date | null;
  to: Date | null;
  paymentMethod: RetailPaymentMethod | null;
  status: RetailOrderStatus | null;
  billingMode: BillingMode | null;
  shippingMethod: RetailShippingMethod | null;
  page: number;
};

export type FinanceSeriesPoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type FinanceBreakdownRow = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type FinanceTopProduct = {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  categoryName?: string;
};

export type FinanceTopCategory = {
  categoryId: string;
  name: string;
  units: number;
  revenue: number;
  productCount: number;
};

export type FinanceOrderRow = {
  id: string;
  createdAt: Date;
  buyerName: string;
  buyerEmail: string;
  paymentMethod: RetailPaymentMethod;
  shippingMethod: RetailShippingMethod;
  billingMode: BillingMode;
  status: RetailOrderStatus;
  totalAmount: number;
  shippingAmount: number;
  promoDiscountAmount: number;
};

export type FinanceDashboard = {
  filters: FinanceFilters;
  rangeLabel: string;
  /** Ingresos (solo revenue statuses, respetando filtro de status si aplica). */
  revenue: number;
  salesCount: number;
  avgTicket: number;
  shippingCollected: number;
  promoDiscounts: number;
  pendingCount: number;
  pendingAmount: number;
  cancelledCount: number;
  previous: {
    revenue: number;
    salesCount: number;
    revenueDeltaPct: number | null;
    salesDeltaPct: number | null;
  };
  series: FinanceSeriesPoint[];
  byPayment: FinanceBreakdownRow[];
  byBilling: FinanceBreakdownRow[];
  byShipping: FinanceBreakdownRow[];
  topProducts: FinanceTopProduct[];
  topCategories: FinanceTopCategory[];
  wholesale: {
    count: number;
    total: number;
  };
  orders: FinanceOrderRow[];
  ordersTotal: number;
  pageSize: number;
};

const PAGE_SIZE = 25;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseDateOnly(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPaymentMethod(v: string): v is RetailPaymentMethod {
  return v === "BANK_TRANSFER" || v === "MERCADO_PAGO";
}

function isShippingMethod(v: string): v is RetailShippingMethod {
  return v === "PICKUP" || v === "DELIVERY" || v === "SHIPPING_TO_COORDINATE";
}

function isBillingMode(v: string): v is BillingMode {
  return v === "NEGRO" || v === "BLANCO";
}

function isOrderStatus(v: string): v is RetailOrderStatus {
  return (
    v === "PENDING_PAYMENT" ||
    v === "PENDING_TRANSFER" ||
    v === "TRANSFER_REPORTED" ||
    v === "PAYMENT_APPROVED" ||
    v === "CONFIRMED" ||
    v === "CANCELLED"
  );
}

export function parseFinanceFilters(
  searchParams: Record<string, string | string[] | undefined>,
): FinanceFilters {
  const get = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const hasCustomDates = Boolean(get("from")?.trim() || get("to")?.trim());
  const presetRaw = (get("preset") ?? (hasCustomDates ? "custom" : "30d")).trim();
  let preset: FinancePreset = ["hoy", "7d", "30d", "mes", "todo", "custom"].includes(presetRaw)
    ? (presetRaw as FinancePreset)
    : "30d";
  if (hasCustomDates) preset = "custom";

  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = endOfDay(now);

  if (preset === "hoy") {
    from = startOfDay(now);
  } else if (preset === "7d") {
    from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  } else if (preset === "30d") {
    from = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  } else if (preset === "mes") {
    from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  } else if (preset === "todo") {
    from = null;
    to = null;
  } else {
    from = parseDateOnly(get("from"));
    to = parseDateOnly(get("to"));
    if (from) from = startOfDay(from);
    if (to) to = endOfDay(to);
    else to = endOfDay(now);
    if (!from) {
      from = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    }
  }

  const pay = get("payment")?.trim() ?? "";
  const st = get("status")?.trim() ?? "";
  const bill = get("billing")?.trim() ?? "";
  const ship = get("shipping")?.trim() ?? "";
  const pageRaw = Number(get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  return {
    preset,
    from,
    to,
    paymentMethod: pay && isPaymentMethod(pay) ? pay : null,
    status: st && isOrderStatus(st) ? st : null,
    billingMode: bill && isBillingMode(bill) ? bill : null,
    shippingMethod: ship && isShippingMethod(ship) ? ship : null,
    page,
  };
}

export function financeRangeLabel(filters: FinanceFilters): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  if (filters.preset === "todo" || (!filters.from && !filters.to)) return "Todo el historial";
  if (filters.from && filters.to) return `${fmt(filters.from)} – ${fmt(filters.to)}`;
  if (filters.from) return `Desde ${fmt(filters.from)}`;
  if (filters.to) return `Hasta ${fmt(filters.to)}`;
  return "Período";
}

function dateWhere(from: Date | null, to: Date | null): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

function baseRetailWhere(
  filters: FinanceFilters,
  opts?: { statuses?: RetailOrderStatus[] },
): Prisma.RetailOrderWhereInput {
  const createdAt = dateWhere(filters.from, filters.to);
  return {
    deletedAt: null,
    ...(createdAt ? { createdAt } : {}),
    ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
    ...(filters.billingMode ? { billingMode: filters.billingMode } : {}),
    ...(filters.shippingMethod ? { shippingMethod: filters.shippingMethod } : {}),
    ...(opts?.statuses
      ? { status: { in: opts.statuses } }
      : filters.status
        ? { status: filters.status }
        : {}),
  };
}

function previousRange(filters: FinanceFilters): { from: Date; to: Date } | null {
  if (!filters.from || !filters.to) return null;
  const duration = filters.to.getTime() - filters.from.getTime();
  if (duration <= 0) return null;
  const prevTo = new Date(filters.from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { from: prevFrom, to: prevTo };
}

function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildSeries(
  orders: Array<{ createdAt: Date; totalAmount: number }>,
  from: Date | null,
  to: Date | null,
): FinanceSeriesPoint[] {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const k = dayKey(o.createdAt);
    const cur = map.get(k) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.totalAmount;
    cur.orders += 1;
    map.set(k, cur);
  }

  if (!from || !to) {
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        key,
        label: key.slice(5).replace("-", "/"),
        revenue: v.revenue,
        orders: v.orders,
      }));
  }

  const days =
    Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const useWeekly = days > 45;
  if (!useWeekly) {
    const points: FinanceSeriesPoint[] = [];
    const cursor = startOfDay(from);
    const end = startOfDay(to);
    while (cursor <= end) {
      const key = dayKey(cursor);
      const v = map.get(key) ?? { revenue: 0, orders: 0 };
      points.push({
        key,
        label: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
        revenue: v.revenue,
        orders: v.orders,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }

  // Agrupar por semana (lunes)
  const weekMap = new Map<string, { revenue: number; orders: number; label: string }>();
  for (const [key, v] of map) {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const day = (dt.getDay() + 6) % 7;
    const monday = new Date(dt);
    monday.setDate(dt.getDate() - day);
    const wk = dayKey(monday);
    const cur = weekMap.get(wk) ?? {
      revenue: 0,
      orders: 0,
      label: `Sem ${monday.getDate()}/${monday.getMonth() + 1}`,
    };
    cur.revenue += v.revenue;
    cur.orders += v.orders;
    weekMap.set(wk, cur);
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, label: v.label, revenue: v.revenue, orders: v.orders }));
}

function num(v: { toString(): string } | number | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

export async function loadFinanceDashboard(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<FinanceDashboard> {
  const filters = parseFinanceFilters(searchParams);

  const revenueWhere = baseRetailWhere(filters, {
    statuses: filters.status
      ? FINANCE_REVENUE_STATUSES.includes(filters.status)
        ? [filters.status]
        : []
      : FINANCE_REVENUE_STATUSES,
  });

  // Si filtraron un status que no es de ingresos, revenue vacío
  const revenueStatusesEmpty =
    Boolean(filters.status) && !FINANCE_REVENUE_STATUSES.includes(filters.status!);

  const pendingWhere = baseRetailWhere(
    { ...filters, status: null },
    { statuses: FINANCE_PENDING_STATUSES },
  );
  const cancelledWhere = baseRetailWhere(
    { ...filters, status: null },
    { statuses: ["CANCELLED"] },
  );

  const listWhere = baseRetailWhere(filters);

  const prev = previousRange(filters);
  const prevFilters: FinanceFilters | null = prev
    ? { ...filters, from: prev.from, to: prev.to, page: 1 }
    : null;

  const [
    revenueOrders,
    pendingAgg,
    cancelledCount,
    orderPage,
    ordersTotal,
    soldItems,
    wholesaleRows,
    prevRevenueOrders,
  ] = await Promise.all([
    revenueStatusesEmpty
      ? Promise.resolve([])
      : prisma.retailOrder.findMany({
          where: revenueWhere,
          select: {
            id: true,
            createdAt: true,
            totalAmount: true,
            shippingAmount: true,
            promoDiscountAmount: true,
            paymentMethod: true,
            billingMode: true,
            shippingMethod: true,
          },
        }),
    prisma.retailOrder.aggregate({
      where: pendingWhere,
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.retailOrder.count({ where: cancelledWhere }),
    prisma.retailOrder.findMany({
      where: listWhere,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        buyerName: true,
        buyerEmail: true,
        paymentMethod: true,
        shippingMethod: true,
        billingMode: true,
        status: true,
        totalAmount: true,
        shippingAmount: true,
        promoDiscountAmount: true,
      },
    }),
    prisma.retailOrder.count({ where: listWhere }),
    revenueStatusesEmpty
      ? Promise.resolve([])
      : prisma.retailOrderItem.findMany({
          where: {
            order: revenueWhere,
            quantity: { gt: 0 },
          },
          select: {
            productId: true,
            productName: true,
            quantity: true,
            subtotal: true,
            product: {
              select: {
                categoryId: true,
                category: { select: { name: true } },
              },
            },
          },
        }),
    prisma.wholesaleRequest.findMany({
      where: {
        status: "CONFIRMADO",
        ...(dateWhere(filters.from, filters.to)
          ? { updatedAt: dateWhere(filters.from, filters.to) }
          : {}),
      },
      select: {
        id: true,
        items: { select: { subtotal: true } },
      },
    }),
    prevFilters && !revenueStatusesEmpty
      ? prisma.retailOrder.findMany({
          where: baseRetailWhere(prevFilters, {
            statuses: filters.status
              ? FINANCE_REVENUE_STATUSES.includes(filters.status)
                ? [filters.status]
                : []
              : FINANCE_REVENUE_STATUSES,
          }),
          select: { totalAmount: true },
        })
      : Promise.resolve([]),
  ]);

  const mappedRevenue = revenueOrders.map((o) => ({
    createdAt: o.createdAt,
    totalAmount: num(o.totalAmount),
    shippingAmount: num(o.shippingAmount),
    promoDiscountAmount: num(o.promoDiscountAmount),
    paymentMethod: o.paymentMethod,
    billingMode: o.billingMode,
    shippingMethod: o.shippingMethod,
  }));

  const revenue = mappedRevenue.reduce((a, o) => a + o.totalAmount, 0);
  const salesCount = mappedRevenue.length;
  const avgTicket = salesCount > 0 ? revenue / salesCount : 0;
  const shippingCollected = mappedRevenue.reduce((a, o) => a + o.shippingAmount, 0);
  const promoDiscounts = mappedRevenue.reduce((a, o) => a + o.promoDiscountAmount, 0);

  const prevRevenue = prevRevenueOrders.reduce((a, o) => a + num(o.totalAmount), 0);
  const prevSalesCount = prevRevenueOrders.length;

  const byPaymentMap = new Map<string, { revenue: number; orders: number }>();
  const byBillingMap = new Map<string, { revenue: number; orders: number }>();
  const byShippingMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of mappedRevenue) {
    for (const [map, key] of [
      [byPaymentMap, o.paymentMethod],
      [byBillingMap, o.billingMode],
      [byShippingMap, o.shippingMethod],
    ] as const) {
      const cur = map.get(key) ?? { revenue: 0, orders: 0 };
      cur.revenue += o.totalAmount;
      cur.orders += 1;
      map.set(key, cur);
    }
  }

  const toBreakdown = (
    map: Map<string, { revenue: number; orders: number }>,
    labels: Record<string, string>,
  ): FinanceBreakdownRow[] =>
    [...map.entries()]
      .map(([key, v]) => ({
        key,
        label: labels[key] ?? key,
        revenue: v.revenue,
        orders: v.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue);

  const wholesaleTotal = wholesaleRows.reduce(
    (acc, r) => acc + r.items.reduce((s, i) => s + num(i.subtotal), 0),
    0,
  );

  const productMap = new Map<
    string,
    { name: string; units: number; revenue: number; categoryName: string }
  >();
  const categoryMap = new Map<
    string,
    { name: string; units: number; revenue: number; productIds: Set<string> }
  >();

  for (const item of soldItems) {
    const units = item.quantity;
    if (units <= 0) continue;
    const revenue = num(item.subtotal);
    const categoryId = item.product?.categoryId ?? "sin-categoria";
    const categoryName = item.product?.category?.name ?? "Sin categoría";

    const prod = productMap.get(item.productId) ?? {
      name: item.productName,
      units: 0,
      revenue: 0,
      categoryName,
    };
    prod.units += units;
    prod.revenue += revenue;
    prod.name = item.productName;
    prod.categoryName = categoryName;
    productMap.set(item.productId, prod);

    const cat = categoryMap.get(categoryId) ?? {
      name: categoryName,
      units: 0,
      revenue: 0,
      productIds: new Set<string>(),
    };
    cat.units += units;
    cat.revenue += revenue;
    cat.productIds.add(item.productId);
    categoryMap.set(categoryId, cat);
  }

  const topProducts: FinanceTopProduct[] = [...productMap.entries()]
    .map(([productId, v]) => ({
      productId,
      name: v.name,
      units: v.units,
      revenue: v.revenue,
      categoryName: v.categoryName,
    }))
    .filter((p) => p.units > 0 && p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, 15);

  const topCategories: FinanceTopCategory[] = [...categoryMap.entries()]
    .map(([categoryId, v]) => ({
      categoryId,
      name: v.name,
      units: v.units,
      revenue: v.revenue,
      productCount: v.productIds.size,
    }))
    .filter((c) => c.units > 0 && c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, 10);

  return {
    filters,
    rangeLabel: financeRangeLabel(filters),
    revenue,
    salesCount,
    avgTicket,
    shippingCollected,
    promoDiscounts,
    pendingCount: pendingAgg._count._all,
    pendingAmount: num(pendingAgg._sum.totalAmount),
    cancelledCount,
    previous: {
      revenue: prevRevenue,
      salesCount: prevSalesCount,
      revenueDeltaPct: prev ? deltaPct(revenue, prevRevenue) : null,
      salesDeltaPct: prev ? deltaPct(salesCount, prevSalesCount) : null,
    },
    series: buildSeries(mappedRevenue, filters.from, filters.to),
    byPayment: toBreakdown(byPaymentMap, {
      BANK_TRANSFER: "Transferencia",
      MERCADO_PAGO: "Mercado Pago",
    }),
    byBilling: toBreakdown(byBillingMap, {
      NEGRO: "Negro",
      BLANCO: "Blanco",
    }),
    byShipping: toBreakdown(byShippingMap, {
      PICKUP: "Retiro",
      DELIVERY: "Domicilio",
      SHIPPING_TO_COORDINATE: "A coordinar",
    }),
    topProducts,
    topCategories,
    wholesale: {
      count: wholesaleRows.length,
      total: wholesaleTotal,
    },
    orders: orderPage.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      buyerName: o.buyerName,
      buyerEmail: o.buyerEmail,
      paymentMethod: o.paymentMethod,
      shippingMethod: o.shippingMethod,
      billingMode: o.billingMode,
      status: o.status,
      totalAmount: num(o.totalAmount),
      shippingAmount: num(o.shippingAmount),
      promoDiscountAmount: num(o.promoDiscountAmount),
    })),
    ordersTotal,
    pageSize: PAGE_SIZE,
  };
}

export async function loadFinanceOrdersForExport(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<FinanceOrderRow[]> {
  const filters = parseFinanceFilters(searchParams);
  const where = baseRetailWhere(filters);
  const rows = await prisma.retailOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      id: true,
      createdAt: true,
      buyerName: true,
      buyerEmail: true,
      paymentMethod: true,
      shippingMethod: true,
      billingMode: true,
      status: true,
      totalAmount: true,
      shippingAmount: true,
      promoDiscountAmount: true,
    },
  });
  return rows.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    paymentMethod: o.paymentMethod,
    shippingMethod: o.shippingMethod,
    billingMode: o.billingMode,
    status: o.status,
    totalAmount: num(o.totalAmount),
    shippingAmount: num(o.shippingAmount),
    promoDiscountAmount: num(o.promoDiscountAmount),
  }));
}

export function financeFiltersToQuery(filters: FinanceFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (filters.preset !== "custom") q.preset = filters.preset;
  if (filters.preset === "custom") {
    if (filters.from) {
      const d = filters.from;
      q.from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    if (filters.to) {
      const d = filters.to;
      q.to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  }
  if (filters.paymentMethod) q.payment = filters.paymentMethod;
  if (filters.status) q.status = filters.status;
  if (filters.billingMode) q.billing = filters.billingMode;
  if (filters.shippingMethod) q.shipping = filters.shippingMethod;
  if (filters.page > 1) q.page = String(filters.page);
  return q;
}
