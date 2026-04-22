import Link from "next/link";
import { notFound } from "next/navigation";
import { WholesaleLeadStatus } from "@prisma/client";
import { updateWholesaleLeadStatus } from "../../actions";
import { wholesaleLeadStatusLabel } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function WholesaleLeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lead = await prisma.wholesaleLead.findUnique({ where: { id } });

  if (!lead) {
    notFound();
  }

  const statusOptions = Object.values(WholesaleLeadStatus);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/mayoristas" className="text-sm text-brand-dark hover:underline">
          ← Volver a mayoristas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Consulta web: {lead.companyName}</h1>
        <p className="text-xs text-slate-500">{lead.email}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datos</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Contacto</dt>
            <dd className="font-medium text-slate-900">{lead.contactName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Teléfono</dt>
            <dd className="text-slate-800">{lead.phone}</dd>
          </div>
          {lead.taxId ? (
            <div>
              <dt className="text-slate-500">CUIT / tax</dt>
              <dd className="font-mono text-slate-800">{lead.taxId}</dd>
            </div>
          ) : null}
          {lead.estimatedVolume ? (
            <div>
              <dt className="text-slate-500">Volumen estimado</dt>
              <dd className="text-slate-800">{lead.estimatedVolume}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500">Mensaje</p>
          <p className="mt-2 whitespace-pre-wrap">{lead.message}</p>
        </div>
      </section>

      <section className="rounded-xl border border-brand/30 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Seguimiento</h2>
        <p className="mt-1 text-xs text-slate-600">
          Marcá el lead como contactado cuando ya hubo respuesta, o cerralo cuando se cotizó o se descartó.
        </p>
        <form action={updateWholesaleLeadStatus} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={lead.id} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Estado</span>
            <select
              name="status"
              defaultValue={lead.status}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {wholesaleLeadStatusLabel[s]}
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
      </section>
    </div>
  );
}
