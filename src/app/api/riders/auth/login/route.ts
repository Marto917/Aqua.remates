import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, hashIp } from "@/lib/client-ip";
import { checkRateLimit, RATE_LIMITS, recordRateLimitAttempt } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { isRidersAppEnabled, ridersAppDisabledResponse } from "@/lib/riders-feature";
import { signRiderToken } from "@/lib/rider-auth";

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});

/** Login exclusivo para la app de riders. No expone otras tablas. */
export async function POST(req: Request) {
  if (!(await isRidersAppEnabled())) {
    return ridersAppDisabledResponse();
  }

  const clientIp = getClientIp(req);
  const ipLimit = RATE_LIMITS.riderLoginIp(hashIp(clientIp));
  const ipCheck = await checkRateLimit(ipLimit);
  if (!ipCheck.allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá unos minutos." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email o contraseña inválidos." }, { status: 400 });
  }

  const rider = await prisma.rider.findUnique({
    where: { email: parsed.data.email },
  });

  if (!rider || !rider.isActive) {
    await recordRateLimitAttempt(ipLimit);
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, rider.passwordHash);
  if (!ok) {
    await recordRateLimitAttempt(ipLimit);
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const token = await signRiderToken({
    sub: rider.id,
    email: rider.email,
    name: rider.name,
  });

  return NextResponse.json({
    token,
    rider: {
      id: rider.id,
      riderNumber: rider.riderNumber,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
    },
  });
}
