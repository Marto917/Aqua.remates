import Link from "next/link";
import type { RetailShippingMethod } from "@prisma/client";
import { dispatchDeliveryFormAction } from "./actions";
import { formatArs } from "@/lib/currency";
import { deliveryDispatchStatusLabel } from "@/lib/delivery-dispatch";
import {
  canDispatchAfterPack,
  fulfillmentStatusLabel,
  isOrderPacked,
} from "@/lib/fulfillment";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import {
  formatFullAddress,
  isHomeDelivery,
  RETAIL_FULFILLMENT_STATUSES,
  shippingMethodBadgeClass,
} from "@/lib/shipping";

type FilterKey = "todos" | "domicilio" | "retiro" | "coordinar";

const FILTERS: { key: FilterKey; label: string; method?: RetailShippingMethod }[] = [
  { key: "todos", label: "Todos" },
  { key: "domicilio", label: "Envío a domicilio", method: "DELIVERY" },
  { key: "retiro", label: "Retiro en sucursal", method: "PICKUP" },
  { key: "coordinar", label: "Envío a coordinar", method: "SHIPPING_TO_COORDINATE" },
];

type PageProps = { searchParams: Promise<{ filtro?: string }> };

export default async function VendedorEnviosPage({ searchParams }: PageProps) {
  await requireStaff();
  const sp = await searchParams;
  const filtro = (sp.filtro ?? "todos") as FilterKey;
  const activeFilter = FILTERS.find((f) => f.key === filtro) ?? FILTERS[0];

  const shippingWhere =
    activeFilter.method != null ? { shippingMethod: activeFilter.method } : {};

  const [retailOrders, wholesaleOrders] = await Promise.all([
    prisma.retailOrder.findMany({
      where: {
        status: { in: RETAIL_FULFILLMENT_STATUSES },
        ...shippingWhere,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { items: true },
    }),
    prisma.wholesaleRequest.findMany({
      where: {
        status: "CONFIRMADO",
        ...shippingWhere,
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: { items: true },
    }),
  ]);

  const domicilioCount = await prisma.retailOrder.count({
    where: {
      status: { in: RETAIL_FULFILLMENT_STATUSES },
      shippingMethod: "DELIVERY",
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Gestión de envíos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pedidos minoristas confirmados. Primero <strong>armá</strong> el pedido (lista de productos), después
          imprimí el ticket o emití el envío a domicilio. El cliente recibe un mail en cada paso.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <p className="text-xs font-medium uppercase text-sky-800">Envíos a domicilio (minorista)</p>
          <p className="mt-1 text-2xl font-semibold text-sky-900">{domicilioCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">En bandeja minorista</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{retailOrders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Mayorista confirmados</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{wholesaleOrders.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "todos" ? "/vendedor/envios" : `/vendedor/envios?filtro=${f.key}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              activeFilter.key === f.key
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Pedidos minoristas</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado pago</th>
                <th className="px-4 py-3">Preparación</th>
                <th className="px-4 py-3">Envío</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {retailOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No hay pedidos minoristas en esta vista.
                  </td>
                </tr>
              ) : (
                retailOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {o.createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{o.buyerName}</div>
                      <p className="text-xs text-slate-500">{o.buyerPhone ?? o.buyerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${shippingMethodBadgeClass(o.shippingMethod)}`}
                      >
                        {retailShippingMethodLabel[o.shippingMethod]}
                      </span>
                      {isHomeDelivery(o.shippingMethod) && o.shippingAddress ? (
                        <p className="mt-1 max-w-xs text-xs text-slate-500">{formatFullAddress(o)}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{formatArs(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3 text-xs">{retailOrderStatusLabel[o.status]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          isOrderPacked(o.packedAt)
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {fulfillmentStatusLabel({
                          packedAt: o.packedAt,
                          shippingMethod: o.shippingMethod,
                          deliveryStatus: o.deliveryStatus,
                        })}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{o.items.length} ítem{o.items.length === 1 ? "" : "s"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {isHomeDelivery(o.shippingMethod) ? (
                        <div className="space-y-1">
                          <span className="text-xs text-slate-600">
                            {deliveryDispatchStatusLabel(o.deliveryStatus)}
                          </span>
                          {o.deliveryStatus === "DISPATCHED" && o.deliveryCode ? (
                            <p className="font-mono text-sm font-semibold text-sky-900">
                              Código: {o.deliveryCode}
                            </p>
                          ) : null}
                          {canDispatchAfterPack(o.shippingMethod, o.packedAt, o.deliveryStatus) ? (
                            <form action={dispatchDeliveryFormAction}>
                              <input type="hidden" name="orderId" value={o.id} />
                              <button
                                type="submit"
                                className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                              >
                                Emitir envío
                              </button>
                            </form>
                          ) : isHomeDelivery(o.shippingMethod) && !isOrderPacked(o.packedAt) ? (
                            <span className="text-xs text-amber-700">Armá antes de emitir</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Link
                          href={`/vendedor/envios/minorista/${o.id}/armar`}
                          className={`font-medium underline ${
                            isOrderPacked(o.packedAt)
                              ? "text-slate-600"
                              : "text-amber-800"
                          }`}
                        >
                          {isOrderPacked(o.packedAt) ? "Ver armado" : "Armar pedido"}
                        </Link>
                        <Link
                          href={`/vendedor/envios/minorista/${o.id}/ticket`}
                          className="font-medium text-brand-dark underline"
                        >
                          Ticket / imprimir
                        </Link>
                        <Link href={`/admin/pedidos/${o.id}`} className="text-xs text-slate-500 underline">
                          Ver pedido
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Pedidos mayoristas confirmados</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {wholesaleOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No hay pedidos mayoristas confirmados en esta vista.
                  </td>
                </tr>
              ) : (
                wholesaleOrders.map((r) => {
                  const total = r.items.reduce((a, it) => a + Number(it.subtotal), 0);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {r.updatedAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{r.companyName}</div>
                        <div className="text-xs text-slate-500">{r.contactName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${shippingMethodBadgeClass(r.shippingMethod)}`}
                        >
                          {retailShippingMethodLabel[r.shippingMethod]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{formatArs(total)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/mayoristas/solicitud/${r.id}`}
                          className="text-xs text-slate-500 underline"
                        >
                          Ver solicitud
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
