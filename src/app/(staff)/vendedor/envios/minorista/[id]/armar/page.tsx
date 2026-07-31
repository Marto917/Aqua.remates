import { StaffBackLink } from "@/components/staff/StaffBackLink";
import { notFound } from "next/navigation";
import { DeliveryDeliveredNotice } from "@/components/shipping/DeliveryDeliveredNotice";
import { OrderPickPanel, type PickLine } from "@/components/shipping/OrderPickPanel";
import { colorLabelToDisplayName } from "@/lib/color-display";
import { isInFulfillmentQueue } from "@/lib/fulfillment";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { formatFullAddress, isHomeDelivery, RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";
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
        <StaffBackLink href="/vendedor/envios" label="Envíos" className="mt-4" />
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
      </div>
    );
  }

  const productIds = [...new Set(order.items.map((i) => i.productId).filter(Boolean))] as string[];
  const variantIds = [...new Set(order.items.map((i) => i.variantId).filter(Boolean))] as string[];

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        imageUrl: true,
        barcodes: { select: { code: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, imageUrl: true, colorLabel: true },
    }),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));

  const items: PickLine[] = order.items.map((line) => {
    const product = line.productId ? productById.get(line.productId) : undefined;
    const variant = line.variantId ? variantById.get(line.variantId) : undefined;
    const colorLabel = line.variantColorLabel ?? variant?.colorLabel ?? null;
    const codes = [
      ...(product?.barcodes.map((b) => b.code) ?? []),
      ...(product?.sku ? [product.sku] : []),
    ].filter((c, i, arr) => c.trim() && arr.indexOf(c) === i);
    return {
      id: line.id,
      productName: line.productName,
      variantColorLabel: colorLabel,
      colorDisplayName: colorLabelToDisplayName(colorLabel),
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      subtotal: Number(line.subtotal),
      imageUrl: variant?.imageUrl || product?.imageUrl || DEFAULT_PRODUCT_IMAGE,
      barcodes: codes,
    };
  });

  const packedAtLabel = order.packedAt
    ? order.packedAt.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <StaffBackLink href="/vendedor/envios" label="Envíos" />
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Armar pedido</h1>
        <p className="mt-1 text-sm text-slate-600">Pedido #{order.id.slice(-8).toUpperCase()}</p>
      </header>
      {isHomeDelivery(order.shippingMethod) && order.deliveryStatus === "DELIVERED" ? (
        <DeliveryDeliveredNotice
          deliveredAt={order.deliveryDeliveredAt}
          buyerName={order.buyerName}
          variant="staff"
        />
      ) : null}
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
