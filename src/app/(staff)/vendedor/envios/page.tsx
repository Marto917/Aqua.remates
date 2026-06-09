import Link from "next/link";
import type { RetailShippingMethod } from "@prisma/client";
import { DeliveryDeliveredNotice } from "@/components/shipping/DeliveryDeliveredNotice";
import { EnviosLiveRefresh } from "@/components/shipping/EnviosLiveRefresh";
import { HomeDeliverButton } from "@/components/shipping/HomeDeliverButton";
import { PickupDeliverButton } from "@/components/shipping/PickupDeliverButton";
import { RiderAssignControls } from "@/components/shipping/RiderAssignControls";
import { ShippingActionsMenu, type ShippingMenuItem } from "@/components/shipping/ShippingActionsMenu";
import { formatArs } from "@/lib/currency";
import {
  canDispatchAfterPack,
  fulfillmentStatusLabel,
  isOrderPacked,
} from "@/lib/fulfillment";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { isRidersAppEnabled } from "@/lib/riders-feature";
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

function buildOrderActions(
  order: {
    id: string;
    shippingMethod: RetailShippingMethod;
    packedAt: Date | null;
    assignedRiderId: string | null;
  },
  ridersAppEnabled: boolean,
): ShippingMenuItem[] {
  const packed = isOrderPacked(order.packedAt);
  const home = isHomeDelivery(order.shippingMethod);
  const ticketOk = canPrintRetailDeliveryTicket(order, ridersAppEnabled);

  const items: ShippingMenuItem[] = [
    {
      label: packed ? "Ver armado" : "Armar pedido",
      href: `/vendedor/envios/minorista/${order.id}/armar`,
      tone: packed ? "default" : "warning",
    },
  ];

  if (ticketOk) {
    items.push({
      label: "Ticket / imprimir",
      href: `/vendedor/envios/minorista/${order.id}/ticket`,
      tone: "primary",
    });
  } else if (home) {
    items.push({
      label: "Ticket / imprimir",
      disabled: true,
      hint: packed
        ? ridersAppEnabled
          ? "Asigná repartidor primero"
          : "Armá el pedido primero"
        : "Armá el pedido primero",
    });
  } else {
    items.push({
      label: "Ticket / imprimir",
      href: `/vendedor/envios/minorista/${order.id}/ticket`,
      tone: "primary",
    });
  }

  items.push({
    label: "Ver pedido completo",
    href: `/admin/pedidos/${order.id}`,
  });

  return items;
}

export default async function VendedorEnviosPage({ searchParams }: PageProps) {
  await requireStaff();
  const sp = await searchParams;
  const filtro = (sp.filtro ?? "todos") as FilterKey;
  const activeFilter = FILTERS.find((f) => f.key === filtro) ?? FILTERS[0];

  const shippingWhere =
    activeFilter.method != null ? { shippingMethod: activeFilter.method } : {};

  const ridersAppEnabled = await isRidersAppEnabled();

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
    ridersAppEnabled
      ? prisma.rider.findMany({
          where: { isActive: true },
          orderBy: { riderNumber: "asc" },
          select: { riderNumber: true, name: true },
        })
      : Promise.resolve([]),
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

  const inTransitCount = retailOrders.filter(
    (o) => isHomeDelivery(o.shippingMethod) && o.deliveryStatus === "DISPATCHED",
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Gestión de envíos</h1>
        <p className="mt-1 text-sm text-slate-600">
          {ridersAppEnabled
            ? "Armá pedidos, asigná repartidor y emití envíos."
            : "Armá pedidos e imprimí tickets. Los repartidores los gestiona el local (sin app riders)."}{" "}
          {ridersAppEnabled ? (
            <Link href="/vendedor/envios/repartidores" className="font-medium text-brand-dark underline">
              Ver viajes por repartidor
            </Link>
          ) : null}
        </p>
        <EnviosLiveRefresh enabled={inTransitCount > 0} />
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <p className="text-xs font-medium uppercase text-sky-800">Domicilio</p>
          <p className="mt-1 text-2xl font-semibold text-sky-900">{domicilioCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">En bandeja</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{retailOrders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Mayorista</p>
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
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">{ridersAppEnabled ? "Repartidor" : "Cierre"}</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {retailOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay pedidos minoristas en esta vista.
                  </td>
                </tr>
              ) : (
                retailOrders.map((o) => {
                  const packed = isOrderPacked(o.packedAt);
                  const homeDelivered =
                    isHomeDelivery(o.shippingMethod) && o.deliveryStatus === "DELIVERED";
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-slate-100 align-top hover:bg-slate-50/80 ${
                        homeDelivered ? "bg-emerald-50/70" : ""
                      }`}
                    >
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
                          <p className="mt-1 max-w-[14rem] text-xs leading-snug text-slate-500">
                            {formatFullAddress(o)}
                          </p>
                        ) : null}
                        {o.shippingMethod === "PICKUP" && packed && o.deliveryStatus !== "DELIVERED" ? (
                          <div className="mt-2">
                            <PickupDeliverButton orderId={o.id} />
                          </div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {formatArs(Number(o.totalAmount))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              packed ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {fulfillmentStatusLabel({
                              packedAt: o.packedAt,
                              shippingMethod: o.shippingMethod,
                              deliveryStatus: o.deliveryStatus,
                            })}
                          </span>
                          <p className="text-[11px] text-slate-500">{retailOrderStatusLabel[o.status]}</p>
                          {ridersAppEnabled &&
                          isHomeDelivery(o.shippingMethod) &&
                          o.deliveryStatus === "DISPATCHED" &&
                          o.deliveryCode ? (
                            <p className="inline-flex rounded-md bg-sky-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-900">
                              Código {o.deliveryCode}
                            </p>
                          ) : null}
                          {o.shippingMethod === "PICKUP" && o.deliveryStatus === "DELIVERED" ? (
                            <p className="text-[11px] font-medium text-emerald-700">Entregado en sucursal</p>
                          ) : null}
                          {homeDelivered ? (
                            <div className="mt-2 max-w-[16rem]">
                              <DeliveryDeliveredNotice
                                deliveredAt={o.deliveryDeliveredAt}
                                buyerName={o.buyerName}
                                variant="staff"
                                compact
                              />
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isHomeDelivery(o.shippingMethod) && ridersAppEnabled ? (
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
                            isPacked={packed}
                          />
                        ) : isHomeDelivery(o.shippingMethod) && packed && o.deliveryStatus !== "DELIVERED" ? (
                          <HomeDeliverButton orderId={o.id} />
                        ) : (
                          <span className="text-xs text-slate-400">No aplica</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ShippingActionsMenu items={buildOrderActions(o, ridersAppEnabled)} />
                      </td>
                    </tr>
                  );
                })
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
                <th className="px-4 py-3 text-right">Acciones</th>
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
                        <ShippingActionsMenu
                          items={[
                            {
                              label: "Ver solicitud",
                              href: `/admin/mayoristas/solicitud/${r.id}`,
                              tone: "primary",
                            },
                          ]}
                        />
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
