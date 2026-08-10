import { StaffChrome } from "@/components/staff/StaffChrome";
import { canOwnerDeleteRetailOrders } from "@/lib/customer-order-delete";
import { prisma } from "@/lib/prisma";
import { canManageUsers, getStaffContext, isOwnerAccess } from "@/lib/staff-auth";
import { getStaffLoginPath } from "@/lib/staff-login-path";
import { staffProfileLine } from "@/lib/staff-display";

type StaffNavProps = {
  area: "admin" | "vendedor";
  children: React.ReactNode;
};

export type StaffNavLink = {
  href: string;
  label: string;
};

export async function StaffNav({ area, children }: StaffNavProps) {
  const ctx = await getStaffContext();
  const role = ctx.session?.user?.role;
  const displayName = ctx.session?.user?.name;
  const showOwner = isOwnerAccess(ctx);
  const showTrash = canOwnerDeleteRetailOrders(ctx.session);
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
    ...(showTrash ? [{ href: "/admin/pedidos/papelera", label: "Papelera" }] : []),
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
    <StaffChrome
      area={area}
      homeHref={homeHref}
      logoUrl={storeRow?.brandLogoUrl}
      links={links}
      preview={Boolean(ctx.preview)}
      profileLine={staffProfileLine(displayName, role)}
      staffLogin={staffLogin}
      signedIn={Boolean(ctx.session?.user)}
    >
      {children}
    </StaffChrome>
  );
}
