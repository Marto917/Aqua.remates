import { StaffAccessLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { canManageUsers, getStaffContext } from "@/lib/staff-auth";

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(6),
  role: z.enum(["OWNER", "EMPLOYEE", "CUSTOMER"]).default("CUSTOMER"),
  staffAccessLevel: z.enum(["MANAGER", "SELLER"]).optional(),
});

const updateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().transform((v) => v.toLowerCase()).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["OWNER", "EMPLOYEE", "CUSTOMER"]).optional(),
  staffAccessLevel: z.enum(["MANAGER", "SELLER"]).nullable().optional(),
});

async function assertCanManage() {
  const ctx = await getStaffContext();
  if (!canManageUsers(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  return ctx;
}

export async function POST(req: Request) {
  const ctx = await assertCanManage();
  if (ctx instanceof NextResponse) return ctx;

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
  const ctx = await assertCanManage();
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!existing) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  if (parsed.data.email && parsed.data.email !== existing.email) {
    const clash = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (clash) {
      return NextResponse.json({ error: "Ese email ya está en uso." }, { status: 409 });
    }
  }

  const role = (parsed.data.role ?? existing.role) as UserRole;
  const staffAccessLevel =
    role === UserRole.OWNER
      ? StaffAccessLevel.MANAGER
      : role === UserRole.EMPLOYEE
        ? (parsed.data.staffAccessLevel as StaffAccessLevel | undefined) ??
          existing.staffAccessLevel ??
          StaffAccessLevel.SELLER
        : null;

  const data: {
    name?: string;
    email?: string;
    passwordHash?: string;
    role?: UserRole;
    staffAccessLevel?: StaffAccessLevel | null;
    emailVerified?: Date | null;
  } = {
    role,
    staffAccessLevel,
    emailVerified: role === UserRole.CUSTOMER ? null : existing.emailVerified ?? new Date(),
  };

  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.email) data.email = parsed.data.email;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSafeSession();
  const ctx = await assertCanManage();
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Falta userId." }, { status: 400 });
  }

  if (session?.user?.id === userId) {
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  if (target.role === UserRole.OWNER) {
    const owners = await prisma.user.count({ where: { role: UserRole.OWNER } });
    if (owners <= 1) {
      return NextResponse.json({ error: "Debe quedar al menos un administrador." }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
