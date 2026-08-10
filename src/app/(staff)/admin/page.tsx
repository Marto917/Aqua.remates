import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { prisma } from "@/lib/prisma";
import { staffProfileLine } from "@/lib/staff-display";

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
      prisma.retailOrder.count({
        where: { status: "PENDING_TRANSFER", deletedAt: null },
      }),
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
          Perfil actual:{" "}
          <strong>{staffProfileLine(session?.user?.name, session?.user?.role)}</strong>
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Link
          href="/admin/pedidos?estado=PENDING_TRANSFER"
          className="group rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-white px-3 py-2.5 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
            Transferencias pendientes
          </p>
          <div className="mt-0.5 flex items-end justify-between">
            <p className="text-xl font-semibold text-brand-dark">{pendingRetail}</p>
            <span className="text-base" aria-hidden>
              💸
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-cyan-800 group-hover:underline">Ver pedidos →</p>
        </Link>
        <Link
          href="/admin/mayoristas?estado=NUEVO"
          className="group rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white px-3 py-2.5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Mayoristas nuevos</p>
          <div className="mt-0.5 flex items-end justify-between">
            <p className="text-xl font-semibold text-amber-700">{nuevosMayoristas}</p>
            <span className="text-base" aria-hidden>
              🏪
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-amber-800 group-hover:underline">Ver mayoristas →</p>
        </Link>
        <Link
          href="/admin/aprobaciones"
          className="group rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white px-3 py-2.5 shadow-sm transition hover:border-violet-300 hover:shadow-md"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            Aprobaciones pendientes
          </p>
          <div className="mt-0.5 flex items-end justify-between">
            <p className="text-xl font-semibold text-slate-900">{pendingApprovals}</p>
            <span className="text-base" aria-hidden>
              ✅
            </span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-violet-800 group-hover:underline">Revisar →</p>
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/pedidos"
          className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none" aria-hidden>
              🛒
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Pedidos minoristas</p>
              <p className="text-xs text-slate-600">Bandeja B2C por transferencia</p>
              <p className="mt-1.5 text-[11px] font-medium text-brand-dark group-hover:underline">
                Ir a pedidos →
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/mayoristas"
          className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none" aria-hidden>
              🤝
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Mayoristas</p>
              <p className="text-xs text-slate-600">Solicitudes, leads y aprobaciones</p>
              <p className="mt-1.5 text-[11px] font-medium text-brand-dark group-hover:underline">
                Ir a mayoristas →
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/productos"
          className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none" aria-hidden>
              🎨
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Catálogo</p>
              <p className="text-xs text-slate-600">Productos, variantes y precios</p>
              <p className="mt-1.5 text-[11px] font-medium text-brand-dark group-hover:underline">
                Gestionar artículos →
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/promociones"
          className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none" aria-hidden>
              🖼️
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Promociones</p>
              <p className="text-xs text-slate-600">Carrusel y banners del home</p>
              <p className="mt-1.5 text-[11px] font-medium text-brand-dark group-hover:underline">
                Gestionar imágenes →
              </p>
            </div>
          </div>
        </Link>
        {showFinanzas ? (
          <Link
            href="/admin/finanzas"
            className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none" aria-hidden>
                📈
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Finanzas</p>
                <p className="text-xs text-slate-600">Métricas y totales</p>
                <p className="mt-1.5 text-[11px] font-medium text-brand-dark group-hover:underline">
                  Ver dashboard →
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            Finanzas restringidas al rol Owner.
          </div>
        )}
        {showFinanzas ? (
          <Link
            href="/admin/aprobaciones"
            className="group rounded-xl border border-brand/40 bg-brand-muted/50 px-3 py-2.5 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none" aria-hidden>
                🧾
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Aprobaciones</p>
                <p className="text-xs text-slate-600">Solicitudes del equipo comercial</p>
                <p className="mt-1.5 text-[11px] font-medium text-brand-dark group-hover:underline">
                  Revisar pendientes →
                </p>
              </div>
            </div>
          </Link>
        ) : null}
        {showFinanzas ? (
          <Link
            href="/admin/usuarios"
            className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none" aria-hidden>
                👥
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Usuarios y permisos</p>
                <p className="text-xs text-slate-600">Cuentas y permisos encargado/vendedor</p>
                <p className="mt-1.5 text-[11px] font-medium text-brand-dark group-hover:underline">
                  Gestionar usuarios →
                </p>
              </div>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
