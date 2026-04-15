import { prisma } from "@/lib/prisma";

export default async function FinancialDashboardPage() {
  const [retailOrders, wholesaleLeads] = await Promise.all([
    prisma.retailOrder.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.wholesaleLead.count(),
  ]);

  const totalSales = retailOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard financiero (solo Owner)</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Ventas registradas</p>
          <p className="text-xl font-semibold">
            {totalSales.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
          </p>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Pedidos minoristas (ultimos 8)</p>
          <p className="text-xl font-semibold">{retailOrders.length}</p>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Leads mayoristas</p>
          <p className="text-xl font-semibold">{wholesaleLeads}</p>
        </article>
      </div>
    </section>
  );
}
