/** Ruta oculta de login staff (sin link público). Ej: /login-aquaremates_administracion */
export function getStaffLoginPath(): string {
  const raw = (process.env.STAFF_LOGIN_PATH ?? "login-aquaremates_administracion").trim();
  const path = raw.replace(/^\/+/, "");
  return `/${path}`;
}

/** True si la URL es el login staff (debe quedar accesible sin sesión). */
export function isStaffLoginPath(pathname: string): boolean {
  const staffLogin = getStaffLoginPath();
  return pathname === staffLogin || pathname.startsWith(`${staffLogin}/`);
}

export function getStaffLoginUrl(origin?: string): string {
  const path = getStaffLoginPath();
  if (origin) {
    return new URL(path, origin).toString();
  }
  return path;
}
