import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export type RateLimitConfig = {
  /** Identificador único del bucket, ej. "register:ip:abc123" */
  bucketKey: string;
  maxAttempts: number;
  windowMs: number;
  /** Si se supera el límite, bloquear por este tiempo adicional (opcional). */
  blockMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
};

function retrySeconds(until: Date): number {
  return Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000));
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date();
  const row = await prisma.rateLimitBucket.findUnique({ where: { bucketKey: config.bucketKey } });

  if (row?.blockedUntil && row.blockedUntil.getTime() > now.getTime()) {
    return {
      allowed: false,
      message: "Demasiados intentos. Esperá unos minutos e intentá de nuevo.",
      retryAfterSeconds: retrySeconds(row.blockedUntil),
    };
  }

  if (!row) return { allowed: true };

  const windowExpired = now.getTime() - row.windowStart.getTime() >= config.windowMs;
  if (windowExpired) return { allowed: true };

  if (row.attemptCount >= config.maxAttempts) {
    const blockedUntil = config.blockMs
      ? new Date(now.getTime() + config.blockMs)
      : new Date(row.windowStart.getTime() + config.windowMs);
    await prisma.rateLimitBucket.update({
      where: { bucketKey: config.bucketKey },
      data: { blockedUntil },
    });
    return {
      allowed: false,
      message: "Demasiados intentos. Esperá unos minutos e intentá de nuevo.",
      retryAfterSeconds: retrySeconds(blockedUntil),
    };
  }

  return { allowed: true };
}

export async function recordRateLimitAttempt(config: RateLimitConfig): Promise<void> {
  const now = new Date();
  const row = await prisma.rateLimitBucket.findUnique({ where: { bucketKey: config.bucketKey } });

  if (!row) {
    await prisma.rateLimitBucket.create({
      data: {
        bucketKey: config.bucketKey,
        attemptCount: 1,
        windowStart: now,
      },
    });
    return;
  }

  const windowExpired = now.getTime() - row.windowStart.getTime() >= config.windowMs;
  if (windowExpired) {
    await prisma.rateLimitBucket.update({
      where: { bucketKey: config.bucketKey },
      data: {
        attemptCount: 1,
        windowStart: now,
        blockedUntil: null,
      },
    });
    return;
  }

  await prisma.rateLimitBucket.update({
    where: { bucketKey: config.bucketKey },
    data: { attemptCount: { increment: 1 } },
  });
}

export async function clearRateLimitBucket(bucketKey: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({ where: { bucketKey } });
}

export function buildRateLimitKey(scope: string, identifier: string): string {
  const hash = createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex").slice(0, 40);
  return `${scope}:${hash}`;
}

/** Helpers preconfigurados para endpoints sensibles. */
export const RATE_LIMITS = {
  registerIp: (ipHash: string): RateLimitConfig => ({
    bucketKey: buildRateLimitKey("register-ip", ipHash),
    maxAttempts: 8,
    windowMs: 60 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  }),
  checkoutUser: (userId: string): RateLimitConfig => ({
    bucketKey: buildRateLimitKey("checkout-user", userId),
    maxAttempts: 15,
    windowMs: 60 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  }),
  checkoutIp: (ipHash: string): RateLimitConfig => ({
    bucketKey: buildRateLimitKey("checkout-ip", ipHash),
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  }),
  loginEmail: (email: string): RateLimitConfig => ({
    bucketKey: buildRateLimitKey("login-email", email),
    maxAttempts: 8,
    windowMs: 15 * 60 * 1000,
    blockMs: 15 * 60 * 1000,
  }),
  riderLoginIp: (ipHash: string): RateLimitConfig => ({
    bucketKey: buildRateLimitKey("rider-login-ip", ipHash),
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  }),
  resendVerificationIp: (ipHash: string): RateLimitConfig => ({
    bucketKey: buildRateLimitKey("resend-ip", ipHash),
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  }),
  transferProofOrder: (orderId: string): RateLimitConfig => ({
    bucketKey: buildRateLimitKey("transfer-proof", orderId),
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
  }),
} as const;
