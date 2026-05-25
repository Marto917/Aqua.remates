import Image from "next/image";
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={homeHref} className="flex items-center gap-2 font-semibold text-brand-dark">
            <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand">
              <Image
                src="/aqua_image.webp"
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-cover"
                unoptimized
              />
            </span>
            <span className="text-lg tracking-tight">AQUA — Panel</span>
          </Link>
          <div className="text-xs text-slate-500">
            {ctx.preview ? (
              <span className="rounded bg-amber-100 px-2 py-1 text-amber-900">Preview backoffice</span>
            ) : (
              <span>
                Sesión:{" "}
                <strong className="text-slate-800">
                  {role === UserRole.OWNER ? "Dueño" : role === UserRole.EMPLOYEE ? "Empleado" : role ?? "—"}
                </strong>
              </span>
            )}
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
          <Link href="/admin/mayoristas" className={linkClass}>
            Mayoristas
          </Link>
          <Link href="/admin/productos" className={linkClass}>
            Catálogo
          </Link>
          {showOwner ? (
            <>
              <Link href="/admin/usuarios" className={linkClass}>
                Usuarios
              </Link>
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
