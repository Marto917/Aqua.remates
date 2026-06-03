import Link from "next/link";
import type { RetailShippingMethod } from "@prisma/client";
import { PickupDeliverButton } from "@/components/shipping/PickupDeliverButton";
import { RiderAssignControls } from "@/components/shipping/RiderAssignControls";
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
  canPrintRetailDeliveryTicket,
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

  const [retailOrders, wholesaleOrders, activeRiders] = await Promise.all([
    prisma.retailOrder.findMany({
      where: {
        status: { in: RETAIL_FULFILLMENT_STATUSES },
        ...shippingWhere,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        items: true,
        assignedRider: { select: { riderNumber: true, name: true } },
      },
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
    prisma.rider.findMany({
      where: { isActive: true },
      orderBy: { riderNumber: "asc" },
      select: { riderNumber: true, name: true },
    }),
  ]);

  const riderOptions = activeRiders.map((r) => ({
    riderNumber: r.riderNumber,
    name: r.name,
  }));

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
          Pedidos minoristas confirmados. Armá el pedido, asigná un <strong>número de repartidor</strong> y emití
          el envío. El registro de viajes está en{" "}
          <Link href="/vendedor/envios/repartidores" className="font-medium text-brand-dark underline">
            Viajes por repartidor
          </Link>
          .
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
                <th className="px-4 py-3">Repartidor</th>
                <th className="px-4 py-3">Envío</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {retailOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
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
                    <td className="px-4 py-3 align-top">
                      {isHomeDelivery(o.shippingMethod) ? (
                        <RiderAssignControls
                          orderId={o.id}
                          riders={riderOptions}
                          assignedRider={o.assignedRider}
                          canDispatch={canDispatchAfterPack(
                            o.shippingMethod,
                            o.packedAt,
                            o.deliveryStatus,
                          )}
                          deliveryStatus={o.deliveryStatus}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
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
                          {isHomeDelivery(o.shippingMethod) && !isOrderPacked(o.packedAt) ? (
                            <span className="text-xs text-amber-700">Armá antes de emitir</span>
                          ) : null}
                        </div>
                      ) : o.shippingMethod === "PICKUP" ? (
                        <div className="space-y-1 text-xs">
                          {isOrderPacked(o.packedAt) ? (
                            o.deliveryStatus === "DELIVERED" ? (
                              <span className="font-medium text-emerald-700">Entregado en sucursal</span>
                            ) : (
                              <PickupDeliverButton orderId={o.id} />
                            )
                          ) : (
                            <span className="text-amber-700">Armá el pedido primero</span>
                          )}
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
                        {canPrintRetailDeliveryTicket(o) ? (
                          <Link
                            href={`/vendedor/envios/minorista/${o.id}/ticket`}
                            className="font-medium text-brand-dark underline"
                          >
                            Ticket / imprimir
                          </Link>
                        ) : isHomeDelivery(o.shippingMethod) ? (
                          <span className="text-xs text-amber-800">
                            Asigná repartidor para el ticket
                          </span>
                        ) : (
                          <Link
                            href={`/vendedor/envios/minorista/${o.id}/ticket`}
                            className="font-medium text-brand-dark underline"
                          >
                            Ticket / imprimir
                          </Link>
                        )}
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
