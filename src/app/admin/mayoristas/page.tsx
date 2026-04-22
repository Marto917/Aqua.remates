import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { wholesaleLeadStatusLabel, wholesaleRequestStatusLabel } from "@/lib/order-labels";

export default async function AdminMayoristasPage() {
  let requests: Awaited<
    ReturnType<
      typeof prisma.wholesaleRequest.findMany<{
        include: {
          customer: { select: { name: true; email: true } };
          assignedTo: { select: { name: true } };
        };
      }>
    >
  > = [];
  let leads: Awaited<ReturnType<typeof prisma.wholesaleLead.findMany>> = [];
  let pendingApprovals = 0;

  try {
    ;[requests, leads, pendingApprovals] = await Promise.all([
      prisma.wholesaleRequest.findMany({
        orderBy: { updatedAt: "desc" },
        take: 60,
        include: {
          customer: { select: { name: true, email: true } },
          assignedTo: { select: { name: true } },
        },
      }),
      prisma.wholesaleLead.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.approvalRequest.count({ where: { status: "PENDING" } }),
    ]);
  } catch (e) {
    console.error(e);
  }

  const nuevasSolicitudes = requests.filter((r) => r.status === "NUEVO").length;
  const nuevosLeads = leads.filter((l) => l.status === "NUEVO").length;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Mayoristas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Solicitudes con cuenta de cliente, consultas web sin login y solicitudes de aprobación al dueño.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Solicitudes nuevas</p>
          <p className="mt-1 text-2xl font-semibold text-brand-dark">{nuevasSolicitudes}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Leads web nuevos</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{nuevosLeads}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Aprobaciones pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pendingApprovals}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Solicitudes (clientes registrados)</h2>
          <Link href="/admin/aprobaciones" className="text-sm font-medium text-brand-dark hover:underline">
            Ver bandeja de aprobaciones
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Asignado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No hay solicitudes mayoristas.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {r.updatedAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.companyName}</div>
                      <div className="text-xs text-slate-500">CUIT {r.cuit}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.customer.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {wholesaleRequestStatusLabel[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.assignedTo?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/mayoristas/solicitud/${r.id}`}
                        className="text-sm font-medium text-brand-dark underline-offset-2 hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Consultas web (formulario de contacto)</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No hay consultas web.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {l.createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{l.companyName}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{l.contactName}</div>
                      <div className="text-xs text-slate-500">{l.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {wholesaleLeadStatusLabel[l.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/mayoristas/lead/${l.id}`}
                        className="text-sm font-medium text-brand-dark underline-offset-2 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Tip: cuando un empleado necesita autorización (precio especial, plazos, crédito), crea una solicitud desde el
        detalle del pedido mayorista. El dueño la resuelve en{" "}
        <Link href="/admin/aprobaciones" className="font-medium text-brand-dark hover:underline">
          Aprobaciones
        </Link>
        .
      </p>
    </div>
  );
}
