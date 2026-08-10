import Link from "next/link";
import { redirect } from "next/navigation";
import {
  TrashPurgeButton,
  TrashRestoreButton,
} from "@/components/staff/TrashOrderButtons";
import { formatArs } from "@/lib/currency";
import { canOwnerDeleteRetailOrders } from "@/lib/customer-order-delete";
import { retailOrderStatusLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import {
  RETAIL_ORDER_TRASH_DAYS,
  daysLeftInTrash,
} from "@/lib/retail-order-trash";
import { getStaffContext } from "@/lib/staff-auth";

export default async function PedidosPapeleraPage() {
  const ctx = await getStaffContext();
  if (!canOwnerDeleteRetailOrders(ctx.session)) {
    redirect("/admin/pedidos");
  }

  let orders: Array<{
    id: string;
    buyerName: string;
    buyerEmail: string;
    totalAmount: { toString(): string } | number;
    status: keyof typeof retailOrderStatusLabel;
    deletedAt: Date | null;
    updatedAt: Date;
  }> = [];

  try {
    orders = await prisma.retailOrder.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 100,
      select: {
        id: true,
        buyerName: true,
        buyerEmail: true,
        totalAmount: true,
        status: true,
        deletedAt: true,
        updatedAt: true,
      },
    });
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/pedidos" className="text-sm text-brand-dark hover:underline">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Papelera de pedidos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Los pedidos borrados quedan acá {RETAIL_ORDER_TRASH_DAYS} días. Después se eliminan
          definitivamente (también podés borrarlos ya).
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Borrado</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Quedan</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  La papelera está vacía.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const deletedAt = o.deletedAt ?? o.updatedAt;
                const left = daysLeftInTrash(deletedAt);
                return (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {deletedAt.toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{o.buyerName}</div>
                      <div className="text-xs text-slate-500">{o.buyerEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                      {formatArs(Number(o.totalAmount))}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {retailOrderStatusLabel[o.status]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {left === 0 ? "Hoy / vencido" : `${left} día${left === 1 ? "" : "s"}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <TrashRestoreButton orderId={o.id} />
                        <TrashPurgeButton orderId={o.id} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
