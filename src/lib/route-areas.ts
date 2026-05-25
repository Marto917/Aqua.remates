import { getStaffLoginPath } from "@/lib/staff-login-path";

/** Rutas del backoffice (sin carrito ni modo mayorista). */
export function isStaffBackofficePath(pathname: string): boolean {
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendedor")) {
    return true;
  }
  const staffLogin = getStaffLoginPath();
  return pathname === staffLogin || pathname.startsWith(`${staffLogin}/`);
}
