import { prisma } from "@/lib/prisma";

const COOLDOWN_MS = 1000 * 60 * 3; // 3 minutos entre envíos
const MAX_SENDS_PER_WINDOW = 5;
const WINDOW_MS = 1000 * 60 * 60 * 24; // 24 horas

export type ResendLimitResult =
  | { allowed: true }
  | { allowed: false; message: string; retryAfterSeconds?: number };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function checkVerificationResendLimit(email: string): Promise<ResendLimitResult> {
  const key = normalizeEmail(email);
  const row = await prisma.verificationEmailThrottle.findUnique({ where: { email: key } });
  if (!row) return { allowed: true };

  const now = Date.now();
  const sinceLast = now - row.lastSentAt.getTime();
  if (sinceLast < COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil((COOLDOWN_MS - sinceLast) / 1000);
    const mins = Math.ceil(retryAfterSeconds / 60);
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Esperá ${mins} minuto${mins === 1 ? "" : "s"} antes de pedir otro mail.`,
    };
  }

  const windowAge = now - row.windowStartedAt.getTime();
  if (windowAge < WINDOW_MS && row.sendsInWindow >= MAX_SENDS_PER_WINDOW) {
    return {
      allowed: false,
      message: "Ya pediste varios reenvíos hoy. Probá mañana o contactanos si no te llega el mail.",
    };
  }

  return { allowed: true };
}

export async function recordVerificationEmailSent(email: string): Promise<void> {
  const key = normalizeEmail(email);
  const now = new Date();
  const row = await prisma.verificationEmailThrottle.findUnique({ where: { email: key } });

  if (!row) {
    await prisma.verificationEmailThrottle.create({
      data: { email: key, lastSentAt: now, sendsInWindow: 1, windowStartedAt: now },
    });
    return;
  }

  const windowExpired = now.getTime() - row.windowStartedAt.getTime() >= WINDOW_MS;
  await prisma.verificationEmailThrottle.update({
    where: { email: key },
    data: {
      lastSentAt: now,
      sendsInWindow: windowExpired ? 1 : row.sendsInWindow + 1,
      windowStartedAt: windowExpired ? now : row.windowStartedAt,
    },
  });
}
