import { notFound } from "next/navigation";
import { ShippingTicketPrint } from "@/components/shipping/ShippingTicketPrint";
import { buildShippingQrPayload } from "@/lib/shipping";
import { generateShippingQrDataUrl } from "@/lib/shipping-ticket-qr";
import { buildWholesaleTicketData, wholesaleRequestToQrPayload } from "@/lib/shipping-ticket";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";

type PageProps = { params: Promise<{ id: string }> };

export default async function WholesaleShippingTicketPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const request = await prisma.wholesaleRequest.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!request) {
    notFound();
  }

  const total = request.items.reduce((acc, it) => acc + Number(it.subtotal), 0);
  const qrJson = buildShippingQrPayload(wholesaleRequestToQrPayload(request));
  const qrDataUrl = await generateShippingQrDataUrl(qrJson);
  const ticket = buildWholesaleTicketData(request, total, qrDataUrl);

  return (
    <div className="py-4">
      <ShippingTicketPrint ticket={ticket} />
    </div>
  );
}
