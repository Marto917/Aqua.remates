import Link from "next/link";
import { StaffBackLink } from "@/components/staff/StaffBackLink";
import { formatRiderNumber } from "@/lib/rider-number";
import { getRiderTripSummaries } from "@/lib/rider-trips";
import { requireStaff } from "@/lib/staff-auth";

export default async function RepartidoresViajesPage() {
  await requireStaff();
  const summaries = await getRiderTripSummaries();

  return (
    <div className="space-y-6">
      <header>
        <StaffBackLink href="/vendedor/envios" label="Gestión de envíos" />
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Viajes por repartidor</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cada repartidor tiene un número fijo (#001, #002…). Usalo al asignar envíos a domicilio para llevar
          el registro y calcular pagos.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Nº</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Total viajes</th>
              <th className="px-4 py-3">Entregados</th>
              <th className="px-4 py-3">En camino</th>
              <th className="px-4 py-3">Asignados sin salir</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay repartidores. El admin principal los crea en{" "}
                  <Link href="/admin/riders" className="font-medium text-brand-dark underline">
                    Admin → Riders
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              summaries.map((s) => (
                <tr key={s.riderId} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono font-semibold text-violet-900">
                    {formatRiderNumber(s.riderNumber)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{s.name}</span>
                    {!s.isActive ? (
                      <span className="ml-2 text-xs text-slate-500">(inactivo)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{s.totalTrips}</td>
                  <td className="px-4 py-3 text-emerald-800">{s.delivered}</td>
                  <td className="px-4 py-3 text-sky-800">{s.inTransit}</td>
                  <td className="px-4 py-3 text-amber-800">{s.pendingAssign}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/vendedor/envios/repartidores/${s.riderNumber}`}
                      className="font-medium text-brand-dark underline"
                    >
                      Ver detalle →
                    </Link>
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
