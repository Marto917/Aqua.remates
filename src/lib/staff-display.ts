import { UserRole } from "@prisma/client";

export function staffRoleLabel(role: UserRole | string | undefined): string {
  if (role === UserRole.OWNER) return "Dueño";
  if (role === UserRole.EMPLOYEE) return "Empleado";
  if (!role) return "sin sesión";
  return String(role);
}

/** Nombre visible + rol para paneles staff. */
export function staffProfileLine(
  name: string | null | undefined,
  role: UserRole | string | undefined,
): string {
  const roleText = staffRoleLabel(role);
  const trimmed = name?.trim();
  return trimmed ? `${trimmed} · ${roleText}` : roleText;
}
