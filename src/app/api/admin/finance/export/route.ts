import { NextResponse } from "next/server";
import {
  loadFinanceOrdersForExport,
  parseFinanceFilters,
  financeRangeLabel,
} from "@/lib/finance-stats";
import {
  retailOrderStatusLabel,
  retailPaymentMethodLabel,
  retailShippingMethodLabel,
} from "@/lib/order-labels";
import { getStaffContext, isOwnerAccess } from "@/lib/staff-auth";

export const runtime = "nodejs";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const ctx = await getStaffContext();
  if (!isOwnerAccess(ctx)) {
    return NextResponse.json({ error: "Solo el dueño puede exportar." }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      params[k] = v;
    });

    const filters = parseFinanceFilters(params);
    const rows = await loadFinanceOrdersForExport(params);

    const header = [
      "id",
      "fecha",
      "cliente",
      "email",
      "pago",
      "envio",
      "facturacion",
      "estado",
      "total",
      "envio_monto",
      "descuento_promo",
    ];

    const lines = [
      `# Finanzas Aqua · ${financeRangeLabel(filters)}`,
      header.join(","),
      ...rows.map((o) =>
        [
          o.id,
          o.createdAt.toISOString(),
          o.buyerName,
          o.buyerEmail,
          retailPaymentMethodLabel[o.paymentMethod],
          retailShippingMethodLabel[o.shippingMethod],
          o.billingMode,
          retailOrderStatusLabel[o.status],
          o.totalAmount.toFixed(2),
          o.shippingAmount.toFixed(2),
          o.promoDiscountAmount.toFixed(2),
        ]
          .map(csvEscape)
          .join(","),
      ),
    ];

    const body = "\uFEFF" + lines.join("\r\n");
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aqua-finanzas-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("GET /api/admin/finance/export:", e);
    return NextResponse.json({ error: "No se pudo exportar." }, { status: 500 });
  }
}
