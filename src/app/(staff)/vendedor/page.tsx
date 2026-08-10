import Link from "next/link";
import { ExportCatalogButton, ExportCatalogTextButton } from "@/components/admin/ExportCatalogButton";
import { getSafeSession } from "@/lib/get-session";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { prisma } from "@/lib/prisma";
import { RETAIL_FULFILLMENT_STATUSES } from "@/lib/shipping";
import { staffProfileLine } from "@/lib/staff-display";

export default async function VendedorHomePage() {
  const session = await getSafeSession();
  const preview = isBackofficePreview();

  let toReview = 0;
  let toPack = 0;
  let pendienteConfirmacion = 0;
  let enviosDomicilio = 0;
  let ridersAppEnabled = false;
  try {
    ;[toReview, toPack, pendienteConfirmacion, enviosDomicilio, ridersAppEnabled] =
      await Promise.all([
        prisma.retailOrder.count({
          where: { deletedAt: null, status: "TRANSFER_REPORTED" },
        }),
        prisma.retailOrder.count({
          where: {
            deletedAt: null,
            status: { in: RETAIL_FULFILLMENT_STATUSES },
            packedAt: null,
            NOT: { status: "TRANSFER_REPORTED" },
          },
        }),
        prisma.wholesaleRequest.count({ where: { status: "PENDIENTE_CONFIRMACION" } }),
        prisma.retailOrder.count({
          where: {
            deletedAt: null,
            status: { in: ["CONFIRMED", "PAYMENT_APPROVED"] },
            shippingMethod: "DELIVERY",
            packedAt: { not: null },
            deliveryStatus: { not: "DELIVERED" },
          },
        }),
        prisma.storeSettings
          .findUnique({ where: { id: "default" }, select: { ridersAppEnabled: true } })
          .then((r) => r?.ridersAppEnabled ?? false),
      ]);
  } catch {
    /* sin DB */
  }

  const attentionTotal = toReview + toPack;

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
          Perfil actual:{" "}
          <strong>{staffProfileLine(session?.user?.name, session?.user?.role)}</strong>
        </p>
      </div>

      {attentionTotal > 0 ? (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-900">
            Atención: {attentionTotal} pedido{attentionTotal === 1 ? "" : "s"} pendiente
            {attentionTotal === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm text-amber-900/90">
            {toReview > 0 ? `${toReview} con comprobante para revisar. ` : null}
            {toPack > 0 ? `${toPack} listo${toPack === 1 ? "" : "s"} para armar.` : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {toReview > 0 ? (
              <Link
                href="/vendedor/pedidos"
                className="inline-flex rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Revisar pagos
              </Link>
            ) : null}
            {toPack > 0 ? (
              <Link
                href="/vendedor/envios"
                className="inline-flex rounded-full border border-amber-500 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
              >
                Ir a armar
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/vendedor/pedidos"
          className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-4 shadow-sm hover:border-amber-400"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Comprobantes a revisar
          </p>
          <p className="mt-1 text-2xl font-semibold text-brand-dark">{toReview}</p>
        </Link>
        <Link
          href="/vendedor/envios"
          className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-4 shadow-sm hover:border-violet-400"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
            Pedidos para armar
          </p>
          <p className="mt-1 text-2xl font-semibold text-violet-900">{toPack}</p>
        </Link>
        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Mayorista a confirmar</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{pendienteConfirmacion}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/vendedor/envios"
          className="group rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md"
        >
          <p className="mb-2 text-2xl" aria-hidden>
            📦
          </p>
          <p className="font-semibold text-slate-900">Gestión de envíos</p>
          <p className="mt-1 text-sm text-slate-600">
            Pedidos confirmados, retiro vs domicilio y tickets con QR ({enviosDomicilio} en camino)
          </p>
          <p className="mt-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 group-hover:bg-sky-200">
            Abrir envíos →
          </p>
        </Link>
        {ridersAppEnabled ? (
          <Link
            href="/vendedor/envios/repartidores"
            className="group rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md"
          >
            <p className="mb-2 text-2xl" aria-hidden>
              🛵
            </p>
            <p className="font-semibold text-slate-900">Viajes por repartidor</p>
            <p className="mt-1 text-sm text-slate-600">
              Registro de envíos asignados por número (#001, #002…) para liquidar pagos
            </p>
            <p className="mt-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-900 group-hover:bg-violet-200">
              Ver registro →
            </p>
          </Link>
        ) : null}
        <Link
          href="/vendedor/pedidos"
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="mb-2 text-2xl" aria-hidden>
            🛍️
          </p>
          <p className="font-semibold text-slate-900">Pedidos minoristas</p>
          <p className="mt-1 text-sm text-slate-600">Ver y actualizar estado del pedido</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Abrir pedidos →
          </p>
        </Link>
        <Link
          href="/vendedor/mayoristas"
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="mb-2 text-2xl" aria-hidden>
            🤝
          </p>
          <p className="font-semibold text-slate-900">Mayoristas</p>
          <p className="mt-1 text-sm text-slate-600">Solicitudes, leads y pedidos de aprobación al dueño</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Abrir mayoristas →
          </p>
        </Link>
        <Link
          href="/admin/promociones"
          className="group rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md"
        >
          <p className="mb-2 text-2xl" aria-hidden>
            🖼️
          </p>
          <p className="font-semibold text-slate-900">Promociones e imágenes</p>
          <p className="mt-1 text-sm text-slate-600">
            Imagen del inicio (desktop y celular), carrusel y bloques promocionales
          </p>
          <p className="mt-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-900 group-hover:bg-violet-200">
            Gestionar imágenes →
          </p>
        </Link>
        <Link
          href="/admin/productos"
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="mb-2 text-2xl" aria-hidden>
            🎨
          </p>
          <p className="font-semibold text-slate-900">Catálogo</p>
          <p className="mt-1 text-sm text-slate-600">Alta y edición de productos</p>
          <p className="mt-3 inline-flex rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-dark group-hover:bg-brand-light">
            Cargar artículos →
          </p>
        </Link>
        <Link
          href="/admin"
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <p className="mb-2 text-2xl" aria-hidden>
            📊
          </p>
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
          ZIP completo (JSON + imágenes) o CSV de texto para cargar en un POS / Excel.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ExportCatalogTextButton
            className="inline-flex rounded-md border border-brand bg-white px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-muted/50 disabled:opacity-60"
            label="Texto para POS"
          />
          <ExportCatalogButton
            className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            label="Descargar ZIP"
          />
        </div>
      </div>
    </section>
  );
}
