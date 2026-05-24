import { notFound } from "next/navigation";
import { ShippingTicketPrint } from "@/components/shipping/ShippingTicketPrint";
import { buildShippingQrPayload } from "@/lib/shipping";
import { generateShippingQrDataUrl } from "@/lib/shipping-ticket-qr";
import { buildRetailTicketData, retailOrderToQrPayload } from "@/lib/shipping-ticket";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";

type PageProps = { params: Promise<{ id: string }> };

export default async function RetailShippingTicketPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const order = await prisma.retailOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  const qrJson = buildShippingQrPayload(retailOrderToQrPayload(order));
  const qrDataUrl = await generateShippingQrDataUrl(qrJson);
  const ticket = buildRetailTicketData(order, qrDataUrl);

  return (
    <div className="py-4">
      <ShippingTicketPrint ticket={ticket} />
    </div>
  );
}
