import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderPickPanel, type PickLine } from "@/components/shipping/OrderPickPanel";
import { isInFulfillmentQueue } from "@/lib/fulfillment";
import { formatFullAddress, RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { staffActionErrorMessage } from "@/lib/staff-action-error";

type PageProps = { params: Promise<{ id: string }> };

export default async function RetailOrderPickPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  let order: Awaited<ReturnType<typeof loadOrder>> | null = null;
  let loadError: string | null = null;

  try {
    order = await loadOrder(id);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    loadError = staffActionErrorMessage(e);
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        <h1 className="text-lg font-semibold">No se pudo cargar el pedido</h1>
        <p className="mt-2">{loadError}</p>
        <Link href="/vendedor/envios" className="mt-4 inline-block font-medium text-brand-dark underline">
          Volver a envíos
        </Link>
      </div>
    );
  }

  if (!order) notFound();

  if (!isInFulfillmentQueue(order.status)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <h1 className="text-lg font-semibold">Pedido no disponible para armar</h1>
        <p className="mt-2">
          Solo podés armar pedidos confirmados o con pago aprobado. Estado actual: {order.status}
        </p>
        <Link href={`/admin/pedidos/${order.id}`} className="mt-4 inline-block font-medium underline">
          Ver en administración
        </Link>
      </div>
    );
  }

  const items: PickLine[] = order.items.map((line) => ({
    id: line.id,
    productName: line.productName,
    variantColorLabel: line.variantColorLabel,
    quantity: line.quantity,
    unitPrice: Number(line.unitPrice),
    subtotal: Number(line.subtotal),
  }));

  const packedAtLabel = order.packedAt
    ? order.packedAt.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <Link href="/vendedor/envios" className="text-sm font-medium text-brand-dark underline">
          ← Envíos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Armar pedido</h1>
        <p className="mt-1 text-sm text-slate-600">Pedido #{order.id.slice(-8).toUpperCase()}</p>
      </header>
      <OrderPickPanel
        orderId={order.id}
        buyerName={order.buyerName}
        shippingMethod={order.shippingMethod}
        shippingAddress={formatFullAddress(order) || null}
        notes={[order.shippingNotes, order.notes].filter(Boolean).join(" · ") || null}
        items={items}
        alreadyPacked={order.packedAt != null}
        packedAtLabel={packedAtLabel}
      />
    </div>
  );
}

async function loadOrder(id: string) {
  const order = await prisma.retailOrder.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ productName: "asc" }, { quantity: "desc" }] },
    },
  });
  if (!order) return null;
  if (!RETAIL_FULFILLMENT_STATUSES.includes(order.status)) {
    return order;
  }
  return order;
}
