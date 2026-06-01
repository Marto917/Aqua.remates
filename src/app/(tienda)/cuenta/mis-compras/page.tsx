import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { DeliveryCodeForCustomer } from "@/components/DeliveryCodeForCustomer";
import { formatArs } from "@/lib/currency";
import { deliveryDispatchStatusLabel } from "@/lib/delivery-dispatch";
import { fulfillmentStatusLabel } from "@/lib/fulfillment";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { isHomeDelivery } from "@/lib/shipping";

export default async function MisComprasPage() {
  const session = await getSafeSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/cuenta/mis-compras");
  }
  if (session.user.role !== UserRole.CUSTOMER) {
    redirect("/");
  }

  const email = session.user.email?.toLowerCase() ?? "";
  const orders = await prisma.retailOrder.findMany({
    where: {
      OR: [{ customerId: session.user.id }, { buyerEmail: email }],
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Mis compras</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pedidos minoristas asociados a tu cuenta. Si tu envío ya salió, acá verás el código para entregárselo al
          repartidor.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
          Todavía no tenés compras registradas.{" "}
          <Link href="/catalog" className="font-medium text-brand underline">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {order.createdAt.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {retailShippingMethodLabel[order.shippingMethod]} · {order.items.length} producto
                    {order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {retailOrderStatusLabel[order.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Total <strong>{formatArs(Number(order.totalAmount))}</strong>
              </p>
              {(order.status === "CONFIRMED" ||
                order.status === "PAYMENT_APPROVED" ||
                order.status === "TRANSFER_REPORTED") &&
              (order.packedAt || order.deliveryStatus) ? (
                <p className="mt-2 text-xs font-medium text-slate-700">
                  {fulfillmentStatusLabel({
                    packedAt: order.packedAt,
                    shippingMethod: order.shippingMethod,
                    deliveryStatus: order.deliveryStatus,
                  })}
                </p>
              ) : null}
              {isHomeDelivery(order.shippingMethod) && order.deliveryStatus ? (
                <p className="mt-1 text-xs text-slate-600">
                  Repartidor: {deliveryDispatchStatusLabel(order.deliveryStatus)}
                </p>
              ) : null}
              {isHomeDelivery(order.shippingMethod) &&
              order.deliveryCode &&
              (order.status === "CONFIRMED" ||
                order.deliveryStatus === "DISPATCHED" ||
                order.deliveryStatus === "PENDING") ? (
                <DeliveryCodeForCustomer code={order.deliveryCode} className="mt-3" />
              ) : null}
              {order.deliveryStatus === "DELIVERED" ? (
                <p className="mt-2 text-xs font-medium text-emerald-800">Entrega confirmada con código.</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled
        className="inline-block cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500"
      >
        Próximamente: mayorista
      </button>
    </div>
  );
}
