import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const session = await getSafeSession();
  const preview = isBackofficePreview();
  const showFinanzas =
    preview || session?.user.role === UserRole.OWNER;

  let pendingRetail = 0;
  let pendingApprovals = 0;
  let nuevosMayoristas = 0;
  try {
    ;[pendingRetail, pendingApprovals, nuevosMayoristas] = await Promise.all([
      prisma.retailOrder.count({ where: { status: "PENDING_TRANSFER" } }),
      prisma.approvalRequest.count({ where: { status: "PENDING" } }),
      prisma.wholesaleRequest.count({ where: { status: "NUEVO" } }),
    ]);
  } catch {
    /* sin DB en build */
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Panel administrador</h1>
        {preview ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Modo preview activo (<code className="rounded bg-white px-1">BACKOFFICE_PREVIEW=true</code>): sin login.
            Desactivá esta variable en producción.
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Perfil actual: <strong>{session?.user.role ?? "sin sesion"}</strong>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Transferencias pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-brand-dark">{pendingRetail}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Mayoristas nuevos</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{nuevosMayoristas}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Aprobaciones pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pendingApprovals}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/admin/pedidos"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="font-semibold text-slate-900">Pedidos minoristas</p>
          <p className="mt-1 text-sm text-slate-600">Bandeja B2C por transferencia</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Ir a pedidos →
          </p>
        </Link>
        <Link
          href="/admin/mayoristas"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="font-semibold text-slate-900">Mayoristas</p>
          <p className="mt-1 text-sm text-slate-600">Solicitudes, leads web y aprobaciones</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Ir a mayoristas →
          </p>
        </Link>
        <Link
          href="/admin/productos"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="font-semibold text-slate-900">Catálogo</p>
          <p className="mt-1 text-sm text-slate-600">Productos, variantes y precios</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Gestionar artículos →
          </p>
        </Link>
        {showFinanzas ? (
          <Link
            href="/admin/finanzas"
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
          >
            <p className="font-semibold text-slate-900">Finanzas</p>
            <p className="mt-1 text-sm text-slate-600">Métricas y totales</p>
            <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
              Ver dashboard →
            </p>
          </Link>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            Finanzas restringidas al rol Owner.
          </div>
        )}
        {showFinanzas ? (
          <Link
            href="/admin/aprobaciones"
            className="group rounded-xl border border-brand/40 bg-brand-muted/50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
          >
            <p className="font-semibold text-slate-900">Aprobaciones</p>
            <p className="mt-1 text-sm text-slate-600">Resolver solicitudes del equipo comercial</p>
            <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-dark">
              Revisar pendientes →
            </p>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
