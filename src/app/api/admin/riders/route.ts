import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { allocateNextRiderNumber } from "@/lib/rider-number";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  phone: z.string().trim().optional(),
  password: z.string().min(6),
});

const patchSchema = z.object({
  riderId: z.string().min(1),
  name: z.string().trim().min(2).optional(),
  phone: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

function isOwner(session: Awaited<ReturnType<typeof getSafeSession>>) {
  return session?.user?.role === UserRole.OWNER;
}

export async function GET() {
  const session = await getSafeSession();
  if (!isOwner(session)) {
    return NextResponse.json({ error: "Solo admin principal." }, { status: 401 });
  }

  const riders = await prisma.rider.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      riderNumber: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ riders });
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

  const exists = await prisma.rider.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ error: "Ese email ya está en uso." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const riderNumber = await allocateNextRiderNumber();
  const rider = await prisma.rider.create({
    data: {
      riderNumber,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash,
    },
    select: {
      id: true,
      riderNumber: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, rider });
}

export async function PATCH(req: Request) {
  const session = await getSafeSession();
  if (!isOwner(session)) {
    return NextResponse.json({ error: "Solo admin principal." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const data: {
    name?: string;
    phone?: string | null;
    isActive?: boolean;
    passwordHash?: string;
  } = {};

  if (parsed.data.name != null) data.name = parsed.data.name;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  await prisma.rider.update({
    where: { id: parsed.data.riderId },
    data,
  });

  return NextResponse.json({ ok: true });
}
