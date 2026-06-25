import type { RetailOrder, RetailOrderItem } from "@prisma/client";
import { sendOrderDeliveredEmail } from "@/lib/order-fulfillment-emails";
import { prisma } from "@/lib/prisma";
import { revalidatePathsAfterRiderDelivery } from "@/lib/revalidate-after-delivery";

type OrderWithItems = RetailOrder & { items: RetailOrderItem[] };

export async function completeOrderDelivery(orderId: string): Promise<void> {
  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.deliveryStatus === "DELIVERED") return;

  await prisma.retailOrder.update({
    where: { id: orderId },
    data: {
      deliveryStatus: "DELIVERED",
      deliveryDeliveredAt: new Date(),
    },
  });

  try {
    await sendOrderDeliveredEmail(order);
  } catch (e) {
    console.error("Email entrega confirmada:", e);
  }

  revalidatePathsAfterRiderDelivery(orderId);
}
