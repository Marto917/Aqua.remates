import type { DeliveryDispatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveRiderDeliveryAddress } from "@/lib/shipping";

export type RiderTripRow = {
  orderId: string;
  buyerName: string;
  address: string;
  totalAmount: number;
  deliveryStatus: DeliveryDispatchStatus | null;
  riderAssignedAt: Date | null;
  deliveryDispatchedAt: Date | null;
  deliveryDeliveredAt: Date | null;
  itemCount: number;
};

export type RiderTripSummary = {
  riderId: string;
  riderNumber: number;
  name: string;
  isActive: boolean;
  totalTrips: number;
  inTransit: number;
  delivered: number;
  pendingAssign: number;
};

export async function getRiderTripSummaries(): Promise<RiderTripSummary[]> {
  const riders = await prisma.rider.findMany({
    orderBy: { riderNumber: "asc" },
    select: {
      id: true,
      riderNumber: true,
      name: true,
      isActive: true,
      assignedOrders: {
        where: { shippingMethod: "DELIVERY" },
        select: { deliveryStatus: true },
      },
    },
  });

  return riders.map((r) => {
    const orders = r.assignedOrders;
    const delivered = orders.filter((o) => o.deliveryStatus === "DELIVERED").length;
    const inTransit = orders.filter((o) => o.deliveryStatus === "DISPATCHED").length;
    const pendingAssign = orders.filter(
      (o) => o.deliveryStatus === "PENDING" || o.deliveryStatus == null,
    ).length;
    return {
      riderId: r.id,
      riderNumber: r.riderNumber,
      name: r.name,
      isActive: r.isActive,
      totalTrips: orders.length,
      inTransit,
      delivered,
      pendingAssign,
    };
  });
}

export async function getRiderTripsByNumber(riderNumber: number): Promise<{
  rider: { id: string; riderNumber: number; name: string; isActive: boolean } | null;
  trips: RiderTripRow[];
}> {
  const rider = await prisma.rider.findUnique({
    where: { riderNumber },
    select: { id: true, riderNumber: true, name: true, isActive: true },
  });
  if (!rider) return { rider: null, trips: [] };

  const orders = await prisma.retailOrder.findMany({
    where: {
      assignedRiderId: rider.id,
      shippingMethod: "DELIVERY",
    },
    orderBy: [{ riderAssignedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      items: { select: { id: true } },
      customer: {
        select: {
          defaultShippingAddress: true,
          defaultShippingCity: true,
          defaultShippingProvince: true,
          defaultShippingPostalCode: true,
        },
      },
    },
  });

  const trips: RiderTripRow[] = orders.map((o) => ({
    orderId: o.id,
    buyerName: o.buyerName,
    address: resolveRiderDeliveryAddress(o, o.customer),
    totalAmount: Number(o.totalAmount),
    deliveryStatus: o.deliveryStatus,
    riderAssignedAt: o.riderAssignedAt,
    deliveryDispatchedAt: o.deliveryDispatchedAt,
    deliveryDeliveredAt: o.deliveryDeliveredAt,
    itemCount: o.items.length,
  }));

  return { rider, trips };
}
