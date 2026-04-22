import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { retailOrderStatusLabel } from "@/lib/order-labels";
import { formatArs } from "@/lib/currency";

export default async function AdminPedidosPage() {
  let orders: Awaited<ReturnType<typeof prisma.retailOrder.findMany>> = [];
  try {
    orders = await prisma.retailOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
    });
  } catch (e) {
    console.error(e);
  }

  const pending = orders.filter((o) => o.status === "PENDING_TRANSFER").length;
  const reported = orders.filter((o) => o.status === "TRANSFER_REPORTED").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Pedidos minoristas (B2C)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Transferencias bancarias: validá comprobantes y avanzá el estado del pedido.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-brand-dark">{pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Comprobante informado</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{reported}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">En bandeja (últimos 80)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{orders.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No hay pedidos todavía.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {o.createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{o.buyerName}</div>
                    <div className="text-xs text-slate-500">{o.buyerEmail}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                    {formatArs(Number(o.totalAmount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {retailOrderStatusLabel[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="text-sm font-medium text-brand-dark underline-offset-2 hover:underline"
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
    </div>
  );
}
