import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkRegistrationDeviceLimit,
  recordRegistrationDevice,
} from "@/lib/registration-device-limit";
import { purgeUnverifiedCustomerAccounts } from "@/lib/data-retention";
import {
  createVerificationToken,
  deliverVerificationEmail,
} from "@/lib/verification-email";
import { recordVerificationEmailSent } from "@/lib/verification-resend-limit";

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

  try {
    await purgeUnverifiedCustomerAccounts();
  } catch (e) {
    console.error("Limpieza cuentas sin verificar:", e);
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const { plainToken, tokenHash, expires } = createVerificationToken();

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: UserRole.CUSTOMER,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: expires,
    },
  });

  await recordRegistrationDevice(parsed.data.deviceId);

  const emailResult = await deliverVerificationEmail({
    to: parsed.data.email,
    name: parsed.data.name,
    plainToken,
  });

  if (emailResult.sent) {
    await recordVerificationEmailSent(parsed.data.email);
  }

  if (!emailResult.sent) {
    if (process.env.NODE_ENV === "development") {
      console.info("[registro] Link de verificación (dev):", emailResult.verifyUrl);
      return NextResponse.json({
        ok: true,
        email: parsed.data.email,
        message:
          "Cuenta creada. En desarrollo el link de verificación se muestra abajo (email no configurado).",
        devLink: emailResult.verifyUrl,
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
    email: parsed.data.email,
    message:
      "Te enviamos un enlace de verificación a tu correo. Revisá también la carpeta de spam.",
  });
}
