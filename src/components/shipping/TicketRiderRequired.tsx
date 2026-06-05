import Link from "next/link";
import { RiderAssignControls } from "@/components/shipping/RiderAssignControls";

type Props = {
  orderId: string;
  buyerName: string;
  riders: { riderNumber: number; name: string }[];
  isPacked: boolean;
};

/** Bloquea el ticket hasta que el pedido esté armado y tenga repartidor (envío a domicilio). */
export function TicketRiderRequired({ orderId, buyerName, riders, isPacked }: Props) {
  if (!isPacked) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <h1 className="text-lg font-semibold text-amber-900">Armá el pedido primero</h1>
        <p>
          El pedido de <strong>{buyerName}</strong> todavía no está armado. Completá el armado antes de
          asignar repartidor y generar el ticket.
        </p>
        <Link
          href={`/vendedor/envios/minorista/${orderId}/armar`}
          className="inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Ir a armar pedido
        </Link>
        <Link href="/vendedor/envios" className="block font-medium text-brand-dark underline">
          ← Volver a envíos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
      <h1 className="text-lg font-semibold text-amber-900">Asigná un repartidor antes del ticket</h1>
      <p>
        El pedido de <strong>{buyerName}</strong> es envío a domicilio. Tenés que elegir el número de
        repartidor antes de generar el QR; así solo ese rider puede tomar el viaje en la app.
      </p>
      <RiderAssignControls
        orderId={orderId}
        riders={riders}
        assignedRider={null}
        canDispatch={false}
        deliveryStatus={null}
        isPacked
      />
      <p className="text-xs text-amber-800">
        Después de asignar, recargá esta página o volvé a «Ticket / imprimir» desde envíos.
      </p>
      <Link href="/vendedor/envios" className="inline-block font-medium text-brand-dark underline">
        ← Volver a envíos
      </Link>
    </div>
  );
}
