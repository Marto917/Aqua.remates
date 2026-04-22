import Link from "next/link";
import { getSafeSession } from "@/lib/get-session";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { prisma } from "@/lib/prisma";

export default async function VendedorHomePage() {
  const session = await getSafeSession();
  const preview = isBackofficePreview();

  let pendingRetail = 0;
  let nuevosMayoristas = 0;
  try {
    ;[pendingRetail, nuevosMayoristas] = await Promise.all([
      prisma.retailOrder.count({ where: { status: "PENDING_TRANSFER" } }),
      prisma.wholesaleRequest.count({ where: { status: "NUEVO" } }),
    ]);
  } catch {
    /* sin DB */
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Panel vendedor</h1>
        {preview ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Modo preview activo (<code className="rounded bg-white px-1">BACKOFFICE_PREVIEW=true</code>): sin login.
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Perfil actual: <strong>{session?.user.role ?? "sin sesion"}</strong>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Transferencias a validar</p>
          <p className="mt-1 text-2xl font-semibold text-brand-dark">{pendingRetail}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Mayoristas nuevos</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{nuevosMayoristas}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/vendedor/pedidos"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="font-semibold text-slate-900">Pedidos minoristas</p>
          <p className="mt-1 text-sm text-slate-600">Ver y actualizar estado del pedido</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Abrir pedidos →
          </p>
        </Link>
        <Link
          href="/vendedor/mayoristas"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="font-semibold text-slate-900">Mayoristas</p>
          <p className="mt-1 text-sm text-slate-600">Solicitudes, leads y pedidos de aprobación al dueño</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Abrir mayoristas →
          </p>
        </Link>
        <Link
          href="/admin/productos"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="font-semibold text-slate-900">Catálogo</p>
          <p className="mt-1 text-sm text-slate-600">Alta y edición de productos</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Cargar artículos →
          </p>
        </Link>
        <Link
          href="/admin"
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="font-semibold text-slate-900">Panel administrador</p>
          <p className="mt-1 text-sm text-slate-600">Finanzas y vista general</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Ir al panel admin →
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-brand/30 bg-brand-muted/40 p-4">
        <p className="font-semibold text-slate-900">Exportar catálogo</p>
        <p className="mt-1 text-sm text-slate-600">
          ZIP con <code className="rounded bg-white px-1">catalog-aqua.json</code> e imágenes en{" "}
          <code className="rounded bg-white px-1">public/uploads/products/</code>.
        </p>
        <a
          href="/api/admin/export-catalog"
          className="mt-3 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Descargar ZIP del catálogo
        </a>
      </div>
    </section>
  );
}
