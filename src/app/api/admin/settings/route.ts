import { NextResponse } from "next/server";
import { z } from "zod";
import { canManageUsers, getStaffContext } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

const schema = z.object({
  bankHolder: z.string().trim().min(1),
  bankAlias: z.string().trim().min(1),
  bankCbu: z.string().trim().min(8),
  bankExtraNotes: z.string().trim().optional(),
  transferDiscountPercent: z.coerce.number().int().min(0).max(90),
  mercadoPagoMarkupPercent: z.coerce.number().int().min(0).max(100),
  discountBadgeLabel: z.string().trim().min(1).max(80),
});

export async function GET() {
  await ensureStoreSettings();
  const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canManageUsers(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {
      ...parsed.data,
      bankExtraNotes: parsed.data.bankExtraNotes || null,
    },
    create: { id: "default", ...parsed.data, bankExtraNotes: parsed.data.bankExtraNotes || null },
  });

  return NextResponse.json({ ok: true });
}
