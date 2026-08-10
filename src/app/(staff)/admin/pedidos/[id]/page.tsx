import Link from "next/link";
import { notFound } from "next/navigation";
import { RetailOrderStatus } from "@prisma/client";
import { updateRetailOrderStatus } from "../actions";
import { DeliveryDeliveredNotice } from "@/components/shipping/DeliveryDeliveredNotice";
import { TransferProofPreview } from "@/components/staff/TransferProofPreview";
import { TransferReviewButtons } from "@/components/staff/TransferReviewButtons";
import { CustomerBannedNotice } from "@/components/staff/CustomerBannedNotice";
import { deliveryDispatchStatusLabel } from "@/lib/delivery-dispatch";
import { formatArs } from "@/lib/currency";
import {
  retailOrderStatusLabel,
  retailPaymentMethodLabel,
  retailShippingMethodLabel,
} from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import { staffActionErrorMessage } from "@/lib/staff-action-error";
import { isHomeDelivery } from "@/lib/shipping";
import { OrderStatusBadge } from "@/components/staff/OrderStatusBadge";
import { StaffDeleteOrderButton } from "@/components/staff/StaffDeleteOrderButton";
import { canOwnerDeleteRetailOrders } from "@/lib/customer-order-delete";
import { getStaffContext } from "@/lib/staff-auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPedidoDetailPage({ params }: PageProps) {
  const { id } = await params;

  let order;

  try {
    order = await prisma.retailOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true } },
        customer: {
          select: {
            email: true,
            name: true,
            transferProofRejectCount: true,
            accountWarning: true,
            bannedUntil: true,
            banReason: true,
          },
        },
      },
    });
  } catch (e) {
    console.error("AdminPedidoDetailPage load:", e);
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        <h1 className="font-semibold">No se pudo cargar el pedido</h1>
        <p className="mt-2">{staffActionErrorMessage(e)}</p>
        <Link href="/admin/pedidos" className="mt-4 inline-block font-medium text-brand-dark underline">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  if (order.deletedAt) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <h1 className="font-semibold">Este pedido está en la papelera</h1>
        <p className="mt-2">
          Podés restaurarlo desde la papelera antes de que se borre definitivamente.
        </p>
        <Link
          href="/admin/pedidos/papelera"
          className="mt-4 inline-block font-medium text-brand-dark underline"
        >
          Ir a la papelera
        </Link>
      </div>
    );
  }

  if (!order.staffSeenAt) {
    try {
      await prisma.retailOrder.update({
        where: { id: order.id },
        data: { staffSeenAt: new Date() },
      });
      order = { ...order, staffSeenAt: new Date() };
    } catch (e) {
      console.error("AdminPedidoDetailPage staffSeenAt:", e);
    }
  }

  const statusOptions = Object.values(RetailOrderStatus);
  const isTransfer = order.paymentMethod === "BANK_TRANSFER";
  const canReviewTransfer =
    isTransfer &&
    order.status !== "CANCELLED" &&
    order.status !== "CONFIRMED" &&
    (order.status === "TRANSFER_REPORTED" || order.status === "PENDING_TRANSFER");

  const staffCtx = await getStaffContext();
  const canDelete = canOwnerDeleteRetailOrders(staffCtx.session);

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
        <div className="flex flex-wrap items-center gap-2">
          {isHomeDelivery(order.shippingMethod) ? (
            <Link
              href={`/vendedor/envios/minorista/${order.id}/ticket`}
              className="inline-flex rounded-full bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-700"
            >
              Ticket de envío
            </Link>
          ) : null}
          <OrderStatusBadge
            status={order.status}
            staffSeenAt={order.staffSeenAt}
            packedAt={order.packedAt}
            shippingMethod={order.shippingMethod}
            deliveryStatus={order.deliveryStatus}
            className="[&>span:first-child]:px-3 [&>span:first-child]:py-1 [&>span:first-child]:text-sm"
          />
          {canDelete ? (
            <StaffDeleteOrderButton orderId={order.id} redirectToList />
          ) : null}
        </div>
      </div>

      {isHomeDelivery(order.shippingMethod) && order.deliveryStatus === "DELIVERED" ? (
        <DeliveryDeliveredNotice
          deliveredAt={order.deliveryDeliveredAt}
          buyerName={order.buyerName}
          variant="staff"
        />
      ) : null}
      {isHomeDelivery(order.shippingMethod) && order.deliveryStatus && order.deliveryStatus !== "DELIVERED" ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          Estado de envío: <strong>{deliveryDispatchStatusLabel(order.deliveryStatus)}</strong>
        </p>
      ) : null}

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
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Cuenta</dt>
                  <dd className="text-right text-slate-800">{order.customer.email}</dd>
                </div>
                {order.customer.transferProofRejectCount > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Comprobantes rechazados</dt>
                    <dd className="text-right font-medium text-amber-800">
                      {order.customer.transferProofRejectCount}
                    </dd>
                  </div>
                ) : null}
                {order.customer.accountWarning ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
                    Esta cuenta tiene historial de problemas (comprobantes / suspensión).
                  </div>
                ) : null}
                {order.customer.bannedUntil ? (
                  <CustomerBannedNotice
                    until={order.customer.bannedUntil.toISOString()}
                    reason={order.customer.banReason}
                  />
                ) : null}
              </>
            ) : null}
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pago y envío</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {Number(order.shippingAmount) > 0 || order.subtotalAmount != null ? (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Subtotal productos</dt>
                  <dd className="text-right text-slate-800">
                    {formatArs(
                      Number(
                        order.subtotalAmount ??
                          Number(order.totalAmount) - Number(order.shippingAmount),
                      ),
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Costo de envío</dt>
                  <dd className="text-right text-slate-800">
                    {Number(order.shippingAmount) > 0
                      ? formatArs(Number(order.shippingAmount))
                      : "Gratis"}
                  </dd>
                </div>
              </>
            ) : null}
            {order.promoCode && Number(order.promoDiscountAmount) > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Código {order.promoCode}</dt>
                <dd className="text-right text-emerald-700">
                  −{formatArs(Number(order.promoDiscountAmount))}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Total</dt>
              <dd className="text-right text-lg font-semibold text-brand-dark">
                {formatArs(Number(order.totalAmount))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Pago</dt>
              <dd className="text-right text-slate-800">{retailPaymentMethodLabel[order.paymentMethod]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Envío</dt>
              <dd className="text-right text-slate-800">{retailShippingMethodLabel[order.shippingMethod]}</dd>
            </div>
            {order.shippingAddress ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Dirección</dt>
                <dd className="text-right text-slate-800">
                  {order.shippingAddress}
                  {order.shippingCity ? `, ${order.shippingCity}` : ""}
                  {order.shippingProvince ? ` (${order.shippingProvince})` : ""}
                </dd>
              </div>
            ) : null}
            {order.shippingNotes ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Notas envío</dt>
                <dd className="text-right text-slate-800">{order.shippingNotes}</dd>
              </div>
            ) : null}
            {order.paymentMethod === "BANK_TRANSFER" && order.transferAlias ? (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Alias</dt>
                  <dd className="text-right font-mono text-xs text-slate-800">{order.transferAlias}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">CBU</dt>
                  <dd className="text-right font-mono text-xs text-slate-800">{order.transferCbu}</dd>
                </div>
              </>
            ) : null}
            {order.mercadoPagoPaymentId ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Pago MP</dt>
                <dd className="text-right font-mono text-xs text-slate-800">{order.mercadoPagoPaymentId}</dd>
              </div>
            ) : null}
          </dl>
          {order.notes ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-medium text-slate-600">Notas del pedido: </span>
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

      {isTransfer && order.transferProofUrl ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
            Comprobante de transferencia
          </h2>
          <p className="mt-1 text-xs text-amber-800">
            Corroborá en el banco que el monto sea exactamente {formatArs(Number(order.totalAmount))}.
          </p>
          <TransferProofPreview url={order.transferProofUrl} />
          {order.transferProofUploadedAt ? (
            <p className="mt-2 text-xs text-slate-600">
              Subido:{" "}
              {order.transferProofUploadedAt.toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          ) : null}
        </section>
      ) : isTransfer && order.status === "PENDING_TRANSFER" ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          El cliente aún no subió el comprobante de transferencia.
        </p>
      ) : null}

      {canReviewTransfer ? (
        <section className="rounded-xl border border-brand/30 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Validar pago por transferencia</h2>
          <p className="mt-1 text-xs text-slate-600">
            Si el pago está acreditado, aceptá el pedido para pasarlo a envíos. Si no, decliná.
          </p>
          <div className="mt-4">
            <TransferReviewButtons
              orderId={order.id}
              hasCustomer={Boolean(order.customerId && order.customer)}
              rejectCount={order.customer?.transferProofRejectCount ?? 0}
              accountWarning={Boolean(order.customer?.accountWarning)}
              bannedUntil={order.customer?.bannedUntil?.toISOString() ?? null}
            />
          </div>
        </section>
      ) : null}

      {!isTransfer || order.status === "CONFIRMED" || order.status === "CANCELLED" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Estado del pedido</h2>
          <form action={updateRetailOrderStatus} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={order.id} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Estado</span>
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
      ) : null}
    </div>
  );
}
