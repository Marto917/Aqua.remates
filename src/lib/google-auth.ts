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

/** Login/registro con Google solo para clientes. Staff debe usar email + contraseña. */
export async function resolveGoogleSignInUser(params: {
  email: string;
  name?: string | null;
}): Promise<
  | {
      ok: true;
      id: string;
      name: string;
      email: string;
      role: UserRole;
      emailVerified: boolean;
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

  if (existing) {
    if (existing.role === UserRole.OWNER || existing.role === UserRole.EMPLOYEE) {
      return { ok: false, reason: "staff_account" };
    }
    if (!existing.emailVerified) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerified: new Date() },
      });
    }
    return {
      ok: true,
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      emailVerified: true,
    };
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const name = params.name?.trim() || email.split("@")[0] || "Cliente";

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
    },
  });

  return {
    ok: true,
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role,
    emailVerified: true,
  };
}
