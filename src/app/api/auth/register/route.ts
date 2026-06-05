import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkRegistrationDeviceLimit,
  recordRegistrationDevice,
} from "@/lib/registration-device-limit";
import { sendVerificationEmail } from "@/lib/send-verification-email";

const registerSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email().transform((e) => e.trim().toLowerCase()),
    password: z.string().min(6),
    passwordConfirm: z.string().min(6),
    deviceId: z.string().min(8).max(128).optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirm"],
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
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const deviceCheck = await checkRegistrationDeviceLimit(parsed.data.deviceId);
  if (!deviceCheck.allowed) {
    return NextResponse.json({ error: deviceCheck.message }, { status: 429 });
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

  await recordRegistrationDevice(parsed.data.deviceId);

  const origin = new URL(req.url).origin;
  const link = buildVerificationLink(plainToken, origin);

  const emailResult = await sendVerificationEmail({
    to: parsed.data.email,
    name: parsed.data.name,
    verifyUrl: link,
  });

  if (!emailResult.sent) {
    if (process.env.NODE_ENV === "development") {
      console.info("[registro] Link de verificación (dev):", link);
      return NextResponse.json({
        ok: true,
        message:
          "Cuenta creada. En desarrollo el link de verificación se muestra abajo (email no configurado).",
        devLink: link,
      });
    }
    return NextResponse.json(
      {
        error:
          "Cuenta creada pero no pudimos enviar el email. Contactanos para activar tu cuenta.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Te enviamos un enlace de verificación a tu correo. Revisá también la carpeta de spam.",
  });
}
