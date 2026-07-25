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

function requiredEnv(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
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

/**
 * Crea la cuenta owner solo si faltan las variables de entorno y el usuario aún no existe.
 * No hay valores por defecto en código: las credenciales viven solo en el entorno.
 */
async function ensurePrimaryOwner() {
  const email = requiredEnv("DEFAULT_OWNER_EMAIL")?.toLowerCase();
  const password = requiredEnv("DEFAULT_OWNER_PASSWORD");
  if (!email || !password) return;

  const name = requiredEnv("DEFAULT_OWNER_NAME") ?? "Administrador";
  await ensureUser({
    name,
    email,
    password,
    role: UserRole.OWNER,
    staffAccessLevel: StaffAccessLevel.MANAGER,
  });
}

/** Crea cuentas staff por defecto solo si existen las env y el usuario no está en la DB. */
export async function ensureDefaultStaffUsers() {
  if (attempted) return;
  attempted = true;
  try {
    await ensurePrimaryOwner();

    const sellerEmail = requiredEnv("DEFAULT_SELLER_EMAIL");
    const sellerPassword = requiredEnv("DEFAULT_SELLER_PASSWORD");
    if (sellerEmail && sellerPassword) {
      await ensureUser({
        name: requiredEnv("DEFAULT_SELLER_NAME") ?? "Vendedor",
        email: sellerEmail,
        password: sellerPassword,
        role: UserRole.EMPLOYEE,
        staffAccessLevel: StaffAccessLevel.SELLER,
      });
    }
  } catch (error) {
    console.error("[bootstrap] No se pudieron asegurar usuarios staff por defecto:", error);
  }
}
