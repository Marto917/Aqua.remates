import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { CustomerAccountStatusBanner } from "@/components/account/CustomerAccountStatusBanner";
import { DeliveryCodeForCustomer } from "@/components/DeliveryCodeForCustomer";
import { DeliveryDeliveredNotice } from "@/components/shipping/DeliveryDeliveredNotice";
import { formatArs } from "@/lib/currency";
import { getCustomerModeration } from "@/lib/customer-moderation";
import { deliveryDispatchStatusLabel } from "@/lib/delivery-dispatch";
import { fulfillmentStatusLabel } from "@/lib/fulfillment";
import { retailOrderStatusLabel, retailShippingMethodLabel } from "@/lib/order-labels";
import { isRidersAppEnabled } from "@/lib/riders-feature";
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
  const ridersAppEnabled = await isRidersAppEnabled();
  const [orders, moderation] = await Promise.all([
    prisma.retailOrder.findMany({
      where: {
        OR: [{ customerId: session.user.id }, { buyerEmail: email }],
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 50,
    }),
    getCustomerModeration(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Mis compras</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pedidos minoristas asociados a tu cuenta.
          {ridersAppEnabled
            ? " Si tu envío ya salió, acá verás el código para entregárselo al repartidor."
            : ""}
        </p>
      </div>

      {moderation ? (
        <CustomerAccountStatusBanner
          bannedUntil={moderation.bannedUntil}
          banReason={moderation.banReason}
          accountWarning={moderation.accountWarning}
        />
      ) : null}
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
              {ridersAppEnabled &&
              isHomeDelivery(order.shippingMethod) &&
              order.deliveryCode &&
              (order.status === "CONFIRMED" ||
                order.deliveryStatus === "DISPATCHED" ||
                order.deliveryStatus === "PENDING") ? (
                <DeliveryCodeForCustomer code={order.deliveryCode} className="mt-3" />
              ) : null}
              {order.deliveryStatus === "DELIVERED" ? (
                <div className="mt-3">
                  <DeliveryDeliveredNotice
                    deliveredAt={order.deliveryDeliveredAt}
                    variant="customer"
                  />
                </div>
              ) : null}
              {order.paymentMethod === "BANK_TRANSFER" &&
              (order.status === "PENDING_TRANSFER" || order.status === "TRANSFER_REPORTED") ? (
                <div className="mt-3">
                  <Link
                    href={`/cuenta/mis-compras/${order.id}/comprobante`}
                    className="inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    {order.status === "PENDING_TRANSFER"
                      ? "Subir comprobante"
                      : "Reemplazar comprobante"}
                  </Link>
                  {order.status === "PENDING_TRANSFER" ? (
                    <p className="mt-2 text-xs text-amber-800">
                      Tu pedido está esperando la transferencia. Subí el comprobante cuando hayas
                      pagado.
                    </p>
                  ) : null}
                </div>
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
