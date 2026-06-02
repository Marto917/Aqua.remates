import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signRiderToken } from "@/lib/rider-auth";

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});

/** Login exclusivo para la app de riders. No expone otras tablas. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email o contraseña inválidos." }, { status: 400 });
  }

  const rider = await prisma.rider.findUnique({
    where: { email: parsed.data.email },
  });

  if (!rider || !rider.isActive) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, rider.passwordHash);
  if (!ok) {
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
