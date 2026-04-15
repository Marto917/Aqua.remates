import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(6),
});

function buildVerificationLink(token: string, origin: string) {
  const url = new URL("/api/auth/verify-email", origin);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const plainToken = randomBytes(32).toString("base64url");
  const emailVerificationTokenHash = createHash("sha256").update(plainToken).digest("hex");
  const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 48);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: UserRole.CUSTOMER,
      emailVerificationTokenHash,
      emailVerificationExpires,
    },
  });

  const origin = new URL(req.url).origin;
  const link = buildVerificationLink(plainToken, origin);

  if (process.env.NODE_ENV === "development") {
    console.info("[registro] Link de verificación (solo dev):", link);
  }

  // Cuando configures RESEND_API_KEY o SMTP, aquí se envía el mail real.
  if (process.env.RESEND_API_KEY) {
    // TODO: enviar con Resend
  }

  return NextResponse.json({
    ok: true,
    message:
      "Te enviamos un enlace de verificación (revisá también spam). En desarrollo, el link se imprime en la consola del servidor.",
    devLink: process.env.NODE_ENV === "development" ? link : undefined,
  });
}
