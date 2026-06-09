import Link from "next/link";
import { notFound } from "next/navigation";
import { formatArs } from "@/lib/currency";
import { deliveryDispatchStatusLabel } from "@/lib/delivery-dispatch";
import { formatRiderNumber } from "@/lib/rider-number";
import { isRidersAppEnabled } from "@/lib/riders-feature";
import { getRiderTripsByNumber } from "@/lib/rider-trips";
import { requireStaff } from "@/lib/staff-auth";
import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ riderNumber: string }> };

export default async function RepartidorViajesDetailPage({ params }: PageProps) {
  await requireStaff();
  if (!(await isRidersAppEnabled())) {
    redirect("/vendedor/envios");
  }
  const { riderNumber: raw } = await params;
  const riderNumber = Number(raw);
  if (!Number.isFinite(riderNumber) || riderNumber < 1) notFound();

  const { rider, trips } = await getRiderTripsByNumber(riderNumber);
  if (!rider) notFound();

  const delivered = trips.filter((t) => t.deliveryStatus === "DELIVERED").length;
  const inTransit = trips.filter((t) => t.deliveryStatus === "DISPATCHED").length;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/vendedor/envios/repartidores" className="text-sm font-medium text-brand-dark underline">
          ← Todos los repartidores
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {formatRiderNumber(rider.riderNumber)} — {rider.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Registro de envíos a domicilio asignados a este repartidor.{" "}
          <strong>{delivered}</strong> entregados · <strong>{inTransit}</strong> en camino ·{" "}
          <strong>{trips.length}</strong> total
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Asignado</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Entregado</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Todavía no hay viajes asignados a este repartidor.
                </td>
              </tr>
            ) : (
              trips.map((t) => (
                <tr key={t.orderId} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {t.riderAssignedAt
                      ? t.riderAssignedAt.toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{t.buyerName}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-600">{t.address || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatArs(t.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs">
                    {deliveryDispatchStatusLabel(t.deliveryStatus)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                    {t.deliveryDeliveredAt
                      ? t.deliveryDeliveredAt.toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
