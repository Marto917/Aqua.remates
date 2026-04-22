import { formatArs } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export default async function AdminFinancePage() {
  const orders = await prisma.retailOrder.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  const totalSales = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  const pendingTransfers = orders.filter((order) => order.status === "PENDING_TRANSFER").length;
  const paidOrders = orders.filter((order) => order.status === "CONFIRMED").length;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard financiero (solo Dueño)</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-600">Ventas acumuladas</p>
          <p className="text-xl font-bold text-brand-900">{formatArs(totalSales)}</p>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-600">Transferencias pendientes</p>
          <p className="text-xl font-bold">{pendingTransfers}</p>
        </article>
        <article className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-600">Pedidos pagos</p>
          <p className="text-xl font-bold">{paidOrders}</p>
        </article>
      </div>
    </section>
  );
}
