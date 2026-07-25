import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { SiteLogo } from "@/components/SiteLogo";
import { StaffMobileNav } from "@/components/staff/StaffMobileNav";
import { prisma } from "@/lib/prisma";
import { canManageUsers, getStaffContext, isOwnerAccess } from "@/lib/staff-auth";
import { getStaffLoginPath } from "@/lib/staff-login-path";
import { staffProfileLine } from "@/lib/staff-display";

type StaffNavProps = {
  area: "admin" | "vendedor";
};

export type StaffNavLink = {
  href: string;
  label: string;
};

export async function StaffNav({ area }: StaffNavProps) {
  const ctx = await getStaffContext();
  const role = ctx.session?.user?.role;
  const displayName = ctx.session?.user?.name;
  const showOwner = isOwnerAccess(ctx);
  const showUsers = canManageUsers(ctx);
  const homeHref = area === "admin" ? "/admin" : "/vendedor";
  const staffLogin = getStaffLoginPath();
  const storeRow = await prisma.storeSettings.findUnique({
    where: { id: "default" },
    select: { ridersAppEnabled: true, brandLogoUrl: true },
  });
  const ridersOn = storeRow?.ridersAppEnabled ?? false;

  const links: StaffNavLink[] = [
    { href: homeHref, label: "Inicio" },
    { href: "/admin/pedidos", label: "Pedidos minoristas" },
    { href: "/vendedor/envios", label: "Envíos" },
    ...(ridersOn ? [{ href: "/vendedor/envios/repartidores", label: "Viajes riders" }] : []),
    { href: "/admin/mayoristas", label: "Mayoristas" },
    { href: "/admin/productos", label: "Catálogo" },
    { href: "/admin/categorias", label: "Categorías" },
    { href: "/admin/promociones", label: "Promociones" },
    { href: "/admin/codigos", label: "Códigos" },
    { href: "/admin/configuracion", label: "Configuración" },
    { href: "/admin/perfil", label: "Mi perfil" },
    ...(showUsers ? [{ href: "/admin/usuarios", label: "Usuarios" }] : []),
    ...(showOwner
      ? [
          { href: "/admin/riders", label: "Riders" },
          { href: "/admin/aprobaciones", label: "Aprobaciones" },
          { href: "/admin/finanzas", label: "Finanzas" },
        ]
      : []),
  ];

  return (
    <>
      {/* Sidebar fijo (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-4 py-4">
          <Link href={homeHref} className="inline-flex font-semibold text-brand-dark">
            <SiteLogo logoUrl={storeRow?.brandLogoUrl} />
          </Link>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Panel {area === "admin" ? "admin" : "vendedor"}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Menú staff">
          <ul className="space-y-0.5">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-muted hover:text-brand-dark"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          {ctx.preview ? (
            <span className="block rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
              Preview backoffice
            </span>
          ) : (
            <p className="px-1 text-xs text-slate-500">
              <strong className="text-slate-800">{staffProfileLine(displayName, role)}</strong>
            </p>
          )}
          {ctx.session?.user ? (
            <SignOutButton
              callbackUrl={staffLogin}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            />
          ) : null}
        </div>
      </aside>

      {/* Barra superior mobile */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <Link href={homeHref} className="font-semibold text-brand-dark">
            <SiteLogo logoUrl={storeRow?.brandLogoUrl} />
          </Link>
          <StaffMobileNav
            links={links}
            preview={Boolean(ctx.preview)}
            profileLine={staffProfileLine(displayName, role)}
            staffLogin={staffLogin}
            signedIn={Boolean(ctx.session?.user)}
          />
        </div>
      </header>
    </>
  );
}
