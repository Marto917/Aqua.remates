import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function getGoogleClientId(): string | null {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    null
  );
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** Muestra el botón de Google en la UI (requiere al menos client id público). */
export function isGoogleSignInUiVisible(): boolean {
  return Boolean(getGoogleClientId());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isStaffRole(role: UserRole): boolean {
  return role === UserRole.OWNER || role === UserRole.EMPLOYEE;
}

/**
 * Login/registro con Google solo para clientes.
 * Si ya existe una cuenta CUSTOMER con ese email (ej. registro con contraseña),
 * se actualiza / vincula con los datos de Google (nombre, foto, email verificado).
 * Staff (vendedor/owner) no se sobrescribe: debe usar login interno.
 */
export async function resolveGoogleSignInUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<
  | {
      ok: true;
      id: string;
      name: string;
      email: string;
      role: UserRole;
      emailVerified: boolean;
      imageUrl: string | null;
    }
  | { ok: false; reason: "no_email" | "staff_account" }
> {
  const email = normalizeEmail(params.email);
  if (!email) {
    return { ok: false, reason: "no_email" };
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  const googleImage = params.image?.trim() || null;
  const googleName = params.name?.trim() || null;

  if (existing) {
    if (isStaffRole(existing.role)) {
      return { ok: false, reason: "staff_account" };
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        emailVerified: new Date(),
        ...(googleName ? { name: googleName } : {}),
        ...(googleImage ? { imageUrl: googleImage } : {}),
        lastActiveAt: new Date(),
      },
    });

    return {
      ok: true,
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      emailVerified: true,
      imageUrl: updated.imageUrl,
    };
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const name = googleName || email.split("@")[0] || "Cliente";

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
      imageUrl: googleImage,
      lastActiveAt: new Date(),
    },
  });

  return {
    ok: true,
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role,
    emailVerified: true,
    imageUrl: created.imageUrl,
  };
}
