import Link from "next/link";
import { notFound } from "next/navigation";
import { ShippingTicketPrint } from "@/components/shipping/ShippingTicketPrint";
import { buildShippingQrPayload } from "@/lib/shipping";
import { buildWholesaleTicketData, wholesaleRequestToQrPayload } from "@/lib/shipping-ticket";
import { prisma } from "@/lib/prisma";
import { staffActionErrorMessage } from "@/lib/staff-action-error";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

async function loadWholesaleTicket(id: string) {
  const request = await prisma.wholesaleRequest.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!request) {
    notFound();
  }

  const total = request.items.reduce((acc, it) => acc + Number(it.subtotal), 0);

  return {
    ticket: buildWholesaleTicketData(request, total),
    qrPayloadJson: buildShippingQrPayload(wholesaleRequestToQrPayload(request)),
  };
}

export default async function WholesaleShippingTicketPage({ params }: PageProps) {
  const { id } = await params;

  let ticketData: Awaited<ReturnType<typeof loadWholesaleTicket>> | null = null;
  let loadError: string | null = null;

  try {
    ticketData = await loadWholesaleTicket(id);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) {
      throw e;
    }
    console.error("WholesaleShippingTicketPage:", e);
    loadError = staffActionErrorMessage(e);
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        <h1 className="text-lg font-semibold">No se pudo generar el ticket</h1>
        <p className="mt-2">{loadError}</p>
        <Link href="/vendedor/envios" className="mt-4 inline-block font-medium text-brand-dark underline">
          Volver a envíos
        </Link>
      </div>
    );
  }

  if (!ticketData) {
    notFound();
  }

  return (
    <div className="py-4">
      <ShippingTicketPrint ticket={ticketData.ticket} qrPayloadJson={ticketData.qrPayloadJson} />
    </div>
  );
}
