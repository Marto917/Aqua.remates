import Link from "next/link";
import { ApprovalStatus } from "@prisma/client";
import { resolveApprovalRequest } from "./actions";
import { prisma } from "@/lib/prisma";
import { approvalStatusLabel } from "@/lib/order-labels";

export default async function AdminAprobacionesPage() {
  let pending: Awaited<
    ReturnType<
      typeof prisma.approvalRequest.findMany<{
        include: {
          wholesaleRequest: { select: { id: true; companyName: true } };
          requestedBy: { select: { name: true; email: true } };
        };
      }>
    >
  > = [];
  let resolved: Awaited<
    ReturnType<
      typeof prisma.approvalRequest.findMany<{
        include: {
          wholesaleRequest: { select: { id: true; companyName: true } };
          requestedBy: { select: { name: true } };
          resolvedBy: { select: { name: true } };
        };
      }>
    >
  > = [];

  try {
    ;[pending, resolved] = await Promise.all([
      prisma.approvalRequest.findMany({
        where: { status: ApprovalStatus.PENDING },
        orderBy: { createdAt: "asc" },
        include: {
          wholesaleRequest: { select: { id: true, companyName: true } },
          requestedBy: { select: { name: true, email: true } },
        },
      }),
      prisma.approvalRequest.findMany({
        where: { status: { not: ApprovalStatus.PENDING } },
        orderBy: { updatedAt: "desc" },
        take: 15,
        include: {
          wholesaleRequest: { select: { id: true, companyName: true } },
          requestedBy: { select: { name: true } },
          resolvedBy: { select: { name: true } },
        },
      }),
    ]);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Aprobaciones (dueño)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Las solicitudes que el equipo comercial envía cuando necesita tu OK explícito.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Pendientes ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No hay solicitudes pendientes.
          </p>
        ) : (
          <ul className="space-y-4">
            {pending.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{a.type}</p>
                    <p className="mt-1 text-slate-800">{a.note}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Pedido por {a.requestedBy.name} ·{" "}
                      {a.createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                    <Link
                      href={`/admin/mayoristas/solicitud/${a.wholesaleRequestId}`}
                      className="mt-2 inline-block text-sm font-medium text-brand-dark hover:underline"
                    >
                      Ver solicitud: {a.wholesaleRequest.companyName} →
                    </Link>
                  </div>
                </div>
                <form action={resolveApprovalRequest} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                  <input type="hidden" name="id" value={a.id} />
                  <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span className="text-slate-600">Comentario de resolución (opcional)</span>
                    <textarea
                      name="resolutionNote"
                      rows={2}
                      placeholder="Ej.: Aprobado 5% extra por volumen de 2 pallets..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <button
                      type="submit"
                      name="status"
                      value={ApprovalStatus.APPROVED}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Aprobar
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value={ApprovalStatus.REJECTED}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                    >
                      Rechazar
                    </button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Últimas resueltas</h2>
        {resolved.length === 0 ? (
          <p className="text-sm text-slate-600">Todavía no hay historial.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {resolved.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3"
              >
                <div>
                  <span className="font-medium text-slate-900">{a.wholesaleRequest.companyName}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-600">{a.type}</span>
                </div>
                <span
                  className={
                    a.status === ApprovalStatus.APPROVED ? "text-emerald-700" : "text-rose-700"
                  }
                >
                  {approvalStatusLabel[a.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
