import { StaffAccessLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

let attempted = false;

type SeedUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  staffAccessLevel?: StaffAccessLevel;
};

function envOr(defaultValue: string, envName: string): string {
  const v = process.env[envName]?.trim();
  return v && v.length > 0 ? v : defaultValue;
}

async function ensureUser(input: SeedUserInput) {
  const email = input.email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return;
  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: input.role,
      staffAccessLevel: input.staffAccessLevel ?? null,
      emailVerified: new Date(),
    },
  });
}

/** Crea cuentas staff por defecto solo si no existen. */
export async function ensureDefaultStaffUsers() {
  if (attempted) return;
  attempted = true;
  try {
    await ensureUser({
      name: envOr("Administrador principal", "DEFAULT_OWNER_NAME"),
      email: envOr("admin@aqua.local", "DEFAULT_OWNER_EMAIL"),
      password: envOr("Admin123456!", "DEFAULT_OWNER_PASSWORD"),
      role: UserRole.OWNER,
      staffAccessLevel: StaffAccessLevel.MANAGER,
    });
    await ensureUser({
      name: envOr("Vendedor", "DEFAULT_SELLER_NAME"),
      email: envOr("vendedor@aqua.local", "DEFAULT_SELLER_EMAIL"),
      password: envOr("Vendedor123!", "DEFAULT_SELLER_PASSWORD"),
      role: UserRole.EMPLOYEE,
      staffAccessLevel: StaffAccessLevel.SELLER,
    });
  } catch (error) {
    console.error("[bootstrap] No se pudieron asegurar usuarios staff por defecto:", error);
  }
}
