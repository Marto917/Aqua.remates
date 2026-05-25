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

/** Cuenta admin principal: crea o actualiza rol y contraseña. */
async function ensurePrimaryOwner() {
  const email = envOr("tokeapp.help@gmail.com", "DEFAULT_OWNER_EMAIL").toLowerCase();
  const password = envOr("Leaparedes05.", "DEFAULT_OWNER_PASSWORD");
  const passwordHash = await bcrypt.hash(password, 10);
  const name = envOr("Administrador", "DEFAULT_OWNER_NAME");

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: UserRole.OWNER,
      staffAccessLevel: StaffAccessLevel.MANAGER,
      emailVerified: new Date(),
    },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.OWNER,
      staffAccessLevel: StaffAccessLevel.MANAGER,
      emailVerified: new Date(),
    },
  });
}

/** Crea cuentas staff por defecto solo si no existen. */
export async function ensureDefaultStaffUsers() {
  if (attempted) return;
  attempted = true;
  try {
    await ensurePrimaryOwner();
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
