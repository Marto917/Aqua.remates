import Link from "next/link";
import { notFound } from "next/navigation";
import { ShippingTicketPrint } from "@/components/shipping/ShippingTicketPrint";
import { TicketRiderRequired } from "@/components/shipping/TicketRiderRequired";
import { buildShippingQrPayload, canPrintRetailDeliveryTicket } from "@/lib/shipping";
import { buildRetailTicketData, retailOrderToQrPayload } from "@/lib/shipping-ticket";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { staffActionErrorMessage } from "@/lib/staff-action-error";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

async function loadRetailTicket(id: string) {
  const order = await prisma.retailOrder.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { productName: "asc" },
      },
      customer: {
        select: {
          defaultShippingAddress: true,
          defaultShippingCity: true,
          defaultShippingProvince: true,
          defaultShippingPostalCode: true,
        },
      },
      assignedRider: {
        select: { id: true, riderNumber: true, name: true },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const qrPayload = retailOrderToQrPayload(order);
  if (!qrPayload) {
    return { needsRider: true as const, order };
  }

  return {
    needsRider: false as const,
    ticket: buildRetailTicketData(order),
    qrPayloadJson: buildShippingQrPayload(qrPayload),
  };
}

export default async function RetailShippingTicketPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  let ticketData: Awaited<ReturnType<typeof loadRetailTicket>> | null = null;
  let loadError: string | null = null;
  let activeRiders: { riderNumber: number; name: string }[] = [];

  try {
    [ticketData, activeRiders] = await Promise.all([
      loadRetailTicket(id),
      prisma.rider.findMany({
        where: { isActive: true },
        orderBy: { riderNumber: "asc" },
        select: { riderNumber: true, name: true },
      }),
    ]);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) {
      throw e;
    }
    console.error("RetailShippingTicketPage:", e);
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

  if (ticketData.needsRider) {
    return (
      <div className="py-4">
        <TicketRiderRequired
          orderId={ticketData.order.id}
          buyerName={ticketData.order.buyerName}
          riders={activeRiders}
        />
      </div>
    );
  }

  return (
    <div className="py-4">
      <ShippingTicketPrint ticket={ticketData.ticket} qrPayloadJson={ticketData.qrPayloadJson} />
    </div>
  );
}
