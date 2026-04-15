import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";

export default async function AdminHomePage() {
  const session = await getSafeSession();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Backoffice</h1>
      <p className="text-sm text-slate-600">
        Perfil actual: <strong>{session?.user.role ?? "sin sesion"}</strong>
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/admin/productos" className="rounded-xl border bg-white p-4 hover:border-brand">
          Gestion de productos
        </Link>
        {session?.user.role === UserRole.OWNER ? (
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
