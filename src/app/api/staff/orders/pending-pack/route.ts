import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";
import { getStaffContext, canStaffAccess } from "@/lib/staff-auth";

export const runtime = "nodejs";

/**
 * Pedidos que requieren acción del vendedor:
 * - toReview: comprobante de transferencia a validar
 * - toPack: pago OK / confirmados aún sin armar
 */
export async function GET() {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const [toReview, toPack] = await Promise.all([
    prisma.retailOrder.findMany({
      where: {
        deletedAt: null,
        status: "TRANSFER_REPORTED",
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        buyerName: true,
        createdAt: true,
        updatedAt: true,
        shippingMethod: true,
        totalAmount: true,
      },
    }),
    prisma.retailOrder.findMany({
      where: {
        deletedAt: null,
        status: { in: RETAIL_FULFILLMENT_STATUSES },
        packedAt: null,
        // TRANSFER_REPORTED ya está en toReview; evitar duplicar en “armar”
        NOT: { status: "TRANSFER_REPORTED" },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        buyerName: true,
        createdAt: true,
        shippingMethod: true,
        totalAmount: true,
      },
    }),
  ]);

  const mapOrder = (o: {
    id: string;
    buyerName: string;
    createdAt: Date;
    shippingMethod: string;
    totalAmount: { toString(): string } | number;
  }) => ({
    id: o.id,
    buyerName: o.buyerName,
    createdAt: o.createdAt.toISOString(),
    shippingMethod: o.shippingMethod,
    totalAmount: Number(o.totalAmount),
  });

  const reviewOrders = toReview.map(mapOrder);
  const packOrders = toPack.map(mapOrder);
  const reviewCount = reviewOrders.length;
  const packCount = packOrders.length;

  return NextResponse.json({
    // Compat con el poller anterior
    count: packCount,
    orders: packOrders,
    reviewCount,
    packCount,
    totalAttention: reviewCount + packCount,
    toReview: reviewOrders,
    toPack: packOrders,
  });
}
