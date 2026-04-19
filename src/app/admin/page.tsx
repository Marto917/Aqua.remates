import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { isBackofficePreview } from "@/lib/backoffice-preview";

export default async function AdminHomePage() {
  const session = await getSafeSession();
  const preview = isBackofficePreview();
  const showFinanzas =
    preview || session?.user.role === UserRole.OWNER;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Panel administrador</h1>
      {preview ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Modo preview activo (<code className="rounded bg-white px-1">BACKOFFICE_PREVIEW=true</code>): sin login.
          Desactivá esta variable en producción.
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        Perfil actual: <strong>{session?.user.role ?? "sin sesion"}</strong>
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/productos" className="rounded-xl border bg-white p-4 hover:border-brand">
          Gestion de productos
        </Link>
        {showFinanzas ? (
          <Link href="/admin/finanzas" className="rounded-xl border bg-white p-4 hover:border-brand">
            Dashboard financiero
          </Link>
        ) : (
          <div className="rounded-xl border bg-slate-100 p-4 text-sm text-slate-500">
            Dashboard financiero restringido al rol Owner.
          </div>
        )}
      </div>
    </section>
  );
}
