import Link from "next/link";
import { UserRole } from "@prisma/client";
import { SignOutButton } from "@/components/SignOutButton";
import { SiteLogo } from "@/components/SiteLogo";
import { canManageUsers, getStaffContext, isOwnerAccess } from "@/lib/staff-auth";
import { getStaffLoginPath } from "@/lib/staff-login-path";

type StaffNavProps = {
  area: "admin" | "vendedor";
};

const linkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-muted hover:text-brand-dark";

export async function StaffNav({ area }: StaffNavProps) {
  const ctx = await getStaffContext();
  const role = ctx.session?.user?.role;
  const showOwner = isOwnerAccess(ctx);
  const showUsers = canManageUsers(ctx);
  const homeHref = area === "admin" ? "/admin" : "/vendedor";
  const staffLogin = getStaffLoginPath();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={homeHref} className="font-semibold text-brand-dark">
            <SiteLogo />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {ctx.preview ? (
              <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
                Preview backoffice
              </span>
            ) : (
              <span className="text-xs text-slate-500">
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
            {ctx.session?.user ? (
              <SignOutButton
                callbackUrl={staffLogin}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              />
            ) : null}
          </div>
        </div>
      </div>
      <nav className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2">
          <Link href={homeHref} className={linkClass}>
            Inicio
          </Link>
          <Link href="/admin/pedidos" className={linkClass}>
            Pedidos minoristas
          </Link>
          <Link href="/vendedor/envios" className={linkClass}>
            Envíos
          </Link>
          <Link href="/vendedor/envios/repartidores" className={linkClass}>
            Viajes riders
          </Link>
          <Link href="/admin/mayoristas" className={linkClass}>
            Mayoristas
          </Link>
          <Link href="/admin/productos" className={linkClass}>
            Catálogo
          </Link>
          <Link href="/admin/categorias" className={linkClass}>
            Categorías
          </Link>
          <Link href="/admin/promociones" className={linkClass}>
            Promociones
          </Link>
          <Link href="/admin/configuracion" className={linkClass}>
            Configuración
          </Link>
          {showUsers ? (
            <Link href="/admin/usuarios" className={linkClass}>
              Usuarios
            </Link>
          ) : null}
          {showOwner ? (
            <>
              <Link href="/admin/riders" className={linkClass}>
                Riders
              </Link>
              <Link href="/admin/aprobaciones" className={linkClass}>
                Aprobaciones
              </Link>
              <Link href="/admin/finanzas" className={linkClass}>
                Finanzas
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
