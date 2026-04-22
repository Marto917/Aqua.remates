import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole, WholesaleRequestStatus } from "@prisma/client";
import {
  assignWholesaleRequest,
  createApprovalRequestFromWholesale,
  updateWholesaleRequestStatus,
} from "../../actions";
import { formatArs } from "@/lib/currency";
import { approvalStatusLabel, wholesaleRequestStatusLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ approval?: string }>;
};

export default async function WholesaleSolicitudDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const [req, staffUsers] = await Promise.all([
    prisma.wholesaleRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: true,
        items: { include: { product: true, variant: true } },
        approvals: {
          orderBy: { createdAt: "desc" },
          include: { requestedBy: { select: { name: true } }, resolvedBy: { select: { name: true } } },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 25,
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: [UserRole.OWNER, UserRole.EMPLOYEE] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  if (!req) {
    notFound();
  }

  const total = req.items.reduce((acc, it) => acc + Number(it.subtotal), 0);
  const statusOptions = Object.values(WholesaleRequestStatus);

  let approvalBanner: string | null = null;
  if (sp.approval === "ok") {
    approvalBanner = "Solicitud de aprobación enviada al dueño.";
  } else if (sp.approval === "invalid") {
    approvalBanner = "Revisá el tipo y la nota (mínimo 5 caracteres).";
  } else if (sp.approval === "need_login") {
    approvalBanner = "Tenés que iniciar sesión como empleado o dueño para pedir aprobaciones.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/mayoristas" className="text-sm text-brand-dark hover:underline">
            ← Volver a mayoristas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{req.companyName}</h1>
          <p className="text-xs text-slate-500">Solicitud {req.id}</p>
        </div>
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
          {wholesaleRequestStatusLabel[req.status]}
        </span>
      </div>

      {approvalBanner ? (
        <p className="rounded-lg border border-brand/40 bg-brand-muted px-4 py-3 text-sm text-slate-800">
          {approvalBanner}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datos fiscales y contacto</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">CUIT</dt>
              <dd className="text-right font-mono text-slate-900">{req.cuit}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Contacto</dt>
              <dd className="text-right text-slate-800">{req.contactName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-right text-slate-800">{req.email}</dd>
            </div>
            {req.phone ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Teléfono</dt>
                <dd className="text-right text-slate-800">{req.phone}</dd>
              </div>
            ) : null}
            {req.address ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Dirección</dt>
                <dd className="text-right text-slate-800">{req.address}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Cuenta en tienda</dt>
              <dd className="text-right text-slate-800">{req.customer.name}</dd>
            </div>
          </dl>
          {req.notes ? (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <span className="font-medium">Notas: </span>
              {req.notes}
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Asignación</h2>
            <form action={assignWholesaleRequest} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={req.id} />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-600">Responsable</span>
                <select
                  name="assignedToId"
                  defaultValue={req.assignedToId ?? "__none"}
                  className="min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="__none">Sin asignar</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === UserRole.OWNER ? "Dueño" : "Empleado"})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Guardar
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Estado del trámite</h2>
            <form action={updateWholesaleRequestStatus} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={req.id} />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-600">Estado</span>
                <select
                  name="status"
                  defaultValue={req.status}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {wholesaleRequestStatusLabel[s]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Actualizar
              </button>
            </form>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ítems cotizados</h2>
          <p className="text-lg font-semibold text-brand-dark">{formatArs(total)}</p>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {req.items.map((line) => (
            <li key={line.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{line.productNameSnapshot}</p>
                {line.colorLabelSnapshot ? (
                  <p className="text-xs text-slate-500">Variante: {line.colorLabelSnapshot}</p>
                ) : null}
                <p className="text-xs text-slate-500">
                  {line.quantity} × {formatArs(Number(line.unitPrice))}
                </p>
              </div>
              <div className="font-medium text-slate-800">{formatArs(Number(line.subtotal))}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-brand/30 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Pedir aprobación al dueño</h2>
        <p className="mt-1 text-xs text-slate-600">
          Usá esto para descuentos fuera de política, plazos de pago o crédito. El dueño responde desde{" "}
          <Link href="/admin/aprobaciones" className="font-medium text-brand-dark hover:underline">
            Aprobaciones
          </Link>
          .
        </p>
        <form action={createApprovalRequestFromWholesale} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="wholesaleRequestId" value={req.id} />
          <label className="flex flex-col gap-1 text-sm md:col-span-1">
            <span className="text-slate-600">Tipo</span>
            <select name="type" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
              <option value="PRECIO_ESPECIAL">Precio especial / descuento extra</option>
              <option value="PLAZO_EXTRA">Plazo de pago / facturación</option>
              <option value="CREDITO">Crédito / riesgo</option>
              <option value="OTRO">Otro (detallar en nota)</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Nota para el dueño</span>
              <textarea
                name="note"
                required
                minLength={5}
                rows={3}
                placeholder="Contexto: qué pidió el cliente, volumen, condiciones..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark md:col-span-2 md:justify-self-start"
          >
            Enviar solicitud de aprobación
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Aprobaciones vinculadas</h2>
        {req.approvals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Todavía no hay solicitudes de aprobación para este pedido.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {req.approvals.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-slate-900">{a.type}</span>
                  <span className="text-xs font-medium text-slate-600">{approvalStatusLabel[a.status]}</span>
                </div>
                <p className="mt-1 text-slate-700">{a.note}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Pedido por {a.requestedBy.name} ·{" "}
                  {a.createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                </p>
                {a.status !== "PENDING" && a.resolutionNote ? (
                  <p className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">Respuesta: </span>
                    {a.resolutionNote}
                    {a.resolvedBy ? ` · ${a.resolvedBy.name}` : null}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Historial de eventos</h2>
        {req.events.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Sin movimientos registrados.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {req.events.map((ev) => (
              <li key={ev.id} className="flex flex-wrap gap-2 border-b border-slate-100 py-2 last:border-0">
                <span className="text-xs text-slate-500">
                  {ev.createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="font-medium text-slate-800">{ev.action}</span>
                <span className="text-slate-600">{ev.user?.name ?? "Sistema"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
