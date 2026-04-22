import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getStaffContext, isOwnerAccess } from "@/lib/staff-auth";

type StaffNavProps = {
  area: "admin" | "vendedor";
};

const linkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-muted hover:text-brand-dark";

export async function StaffNav({ area }: StaffNavProps) {
  const ctx = await getStaffContext();
  const role = ctx.session?.user?.role;
  const showOwner = isOwnerAccess(ctx);
  const homeHref = area === "admin" ? "/admin" : "/vendedor";

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          <Link href={homeHref} className={linkClass}>
            Inicio
          </Link>
          <Link href="/admin/pedidos" className={linkClass}>
            Pedidos minoristas
          </Link>
          <Link href="/admin/mayoristas" className={linkClass}>
            Mayoristas
          </Link>
          <Link href="/admin/productos" className={linkClass}>
            Catálogo
          </Link>
          {showOwner ? (
            <>
              <Link href="/admin/aprobaciones" className={linkClass}>
                Aprobaciones
              </Link>
              <Link href="/admin/finanzas" className={linkClass}>
                Finanzas
              </Link>
            </>
          ) : null}
        </div>
        <div className="text-xs text-slate-500">
          {ctx.preview ? (
            <span className="rounded bg-amber-100 px-2 py-1 text-amber-900">Preview backoffice</span>
          ) : (
            <span>
              Sesión:{" "}
              <strong className="text-slate-800">
                {role === UserRole.OWNER
                  ? "Dueño"
                  : role === UserRole.EMPLOYEE
                    ? "Empleado"
                    : role ?? "—"}
              </strong>
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
