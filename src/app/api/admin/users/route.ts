import { StaffAccessLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(6),
  role: z.enum(["OWNER", "EMPLOYEE", "CUSTOMER"]).default("CUSTOMER"),
  staffAccessLevel: z.enum(["MANAGER", "SELLER"]).optional(),
});

function isOwner(session: Awaited<ReturnType<typeof getSafeSession>>) {
  return session?.user?.role === UserRole.OWNER;
}

export async function POST(req: Request) {
  const session = await getSafeSession();
  if (!isOwner(session)) {
    return NextResponse.json({ error: "Solo admin principal." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ error: "Ese email ya está en uso." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const role = parsed.data.role as UserRole;
  const staffAccessLevel =
    role === UserRole.OWNER
      ? StaffAccessLevel.MANAGER
      : role === UserRole.EMPLOYEE
        ? (parsed.data.staffAccessLevel as StaffAccessLevel | undefined) ?? StaffAccessLevel.SELLER
        : null;

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role,
      staffAccessLevel,
      emailVerified: role === UserRole.CUSTOMER ? null : new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await getSafeSession();
  if (!isOwner(session)) {
    return NextResponse.json({ error: "Solo admin principal." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { userId?: string; role?: UserRole; staffAccessLevel?: StaffAccessLevel | null }
    | null;
  if (!body?.userId) {
    return NextResponse.json({ error: "Falta userId." }, { status: 400 });
  }

  const role = body.role;
  const staffAccessLevel =
    role === UserRole.OWNER
      ? StaffAccessLevel.MANAGER
      : role === UserRole.EMPLOYEE
        ? body.staffAccessLevel ?? StaffAccessLevel.SELLER
        : null;

  await prisma.user.update({
    where: { id: body.userId },
    data: {
      role,
      staffAccessLevel,
      emailVerified: role === UserRole.CUSTOMER ? null : new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}
