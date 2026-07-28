import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";
import { getStaffContext, canStaffAccess } from "@/lib/staff-auth";

export const runtime = "nodejs";

/** Pedidos confirmados / en cola de fulfillment aún sin armar. */
export async function GET() {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const orders = await prisma.retailOrder.findMany({
    where: {
      status: { in: RETAIL_FULFILLMENT_STATUSES },
      packedAt: null,
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
  });

  return NextResponse.json({
    count: orders.length,
    orders: orders.map((o) => ({
      id: o.id,
      buyerName: o.buyerName,
      createdAt: o.createdAt.toISOString(),
      shippingMethod: o.shippingMethod,
      totalAmount: Number(o.totalAmount),
    })),
  });
}
