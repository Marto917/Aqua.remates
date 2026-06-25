import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkVerificationResendLimit,
  recordVerificationEmailSent,
} from "@/lib/verification-resend-limit";
import {
  createVerificationToken,
  deliverVerificationEmail,
} from "@/lib/verification-email";

const bodySchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
});

const GENERIC_OK =
  "Si tu cuenta existe y aún no está verificada, te enviamos un nuevo enlace. Revisá spam.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }

  const email = parsed.data.email;
  const limit = await checkVerificationResendLimit(email);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.message, retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true, message: GENERIC_OK });
  }

  const { plainToken, tokenHash, expires } = createVerificationToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: expires,
    },
  });

  const emailResult = await deliverVerificationEmail({
    to: user.email,
    name: user.name,
    plainToken,
  });

  if (!emailResult.sent) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        ok: true,
        message: GENERIC_OK,
        devLink: emailResult.verifyUrl,
      });
    }
    return NextResponse.json(
      { error: "No pudimos enviar el mail. Intentá de nuevo en unos minutos." },
      { status: 503 },
    );
  }

  await recordVerificationEmailSent(email);
  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
