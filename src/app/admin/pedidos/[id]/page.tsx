import Link from "next/link";
import { notFound } from "next/navigation";
import { RetailOrderStatus } from "@prisma/client";
import { updateRetailOrderStatus } from "../actions";
import { formatArs } from "@/lib/currency";
import { retailOrderStatusLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminPedidoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await prisma.retailOrder.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, variant: true } },
      customer: { select: { email: true, name: true } },
    },
  });

  if (!order) {
    notFound();
  }

  const statusOptions = Object.values(RetailOrderStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/pedidos" className="text-sm text-brand-dark hover:underline">
            ← Volver a pedidos
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pedido minorista</h1>
          <p className="text-xs text-slate-500">ID: {order.id}</p>
        </div>
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
          {retailOrderStatusLabel[order.status]}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comprador</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Nombre</dt>
              <dd className="text-right font-medium text-slate-900">{order.buyerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-right text-slate-800">{order.buyerEmail}</dd>
            </div>
            {order.buyerPhone ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Teléfono</dt>
                <dd className="text-right text-slate-800">{order.buyerPhone}</dd>
              </div>
            ) : null}
            {order.customer ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Cuenta</dt>
                <dd className="text-right text-slate-800">{order.customer.email}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Facturación</dt>
              <dd className="text-right text-slate-800">{order.billingMode}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transferencia</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Total</dt>
              <dd className="text-right text-lg font-semibold text-brand-dark">
                {formatArs(Number(order.totalAmount))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Alias</dt>
              <dd className="text-right font-mono text-xs text-slate-800">{order.transferAlias}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">CBU</dt>
              <dd className="text-right font-mono text-xs text-slate-800">{order.transferCbu}</dd>
            </div>
          </dl>
          {order.notes ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-medium text-slate-600">Notas: </span>
              {order.notes}
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ítems</h2>
        {order.items.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Este pedido no tiene líneas guardadas (flujo manual de monto total). Podés igualmente gestionar el estado
            abajo.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {order.items.map((line) => (
              <li key={line.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{line.productName}</p>
                  {line.variantColorLabel ? (
                    <p className="text-xs text-slate-500">Color: {line.variantColorLabel}</p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    {line.quantity} × {formatArs(Number(line.unitPrice))}
                  </p>
                </div>
                <div className="font-medium text-slate-800">{formatArs(Number(line.subtotal))}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-brand/30 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Cambiar estado del pedido</h2>
        <p className="mt-1 text-xs text-slate-600">
          Flujo sugerido: pendiente → comprobante informado → confirmado (o cancelar si corresponde).
        </p>
        <form action={updateRetailOrderStatus} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={order.id} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Nuevo estado</span>
            <select
              name="status"
              defaultValue={order.status}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {retailOrderStatusLabel[s]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Guardar
          </button>
        </form>
      </section>
    </div>
  );
}
