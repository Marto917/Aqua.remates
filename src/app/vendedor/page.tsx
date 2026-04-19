import Link from "next/link";
import { getSafeSession } from "@/lib/get-session";
import { isBackofficePreview } from "@/lib/backoffice-preview";

export default async function VendedorHomePage() {
  const session = await getSafeSession();
  const preview = isBackofficePreview();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Panel vendedor</h1>
      {preview ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Modo preview activo (<code className="rounded bg-white px-1">BACKOFFICE_PREVIEW=true</code>): sin login.
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        Perfil actual: <strong>{session?.user.role ?? "sin sesion"}</strong>
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/productos" className="rounded-xl border bg-white p-4 hover:border-brand">
          Catalogo y stock
        </Link>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Pedidos mayoristas</p>
          <p className="mt-1">Proximamente: bandeja de solicitudes y seguimiento.</p>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        El panel financiero y la configuracion global siguen en{" "}
        <Link href="/admin" className="font-medium text-brand underline">
          Panel administrador
        </Link>
        .
      </p>
    </section>
  );
}
