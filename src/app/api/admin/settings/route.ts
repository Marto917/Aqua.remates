import { NextResponse } from "next/server";
import { z } from "zod";
import { canStaffAccess, getStaffContext, isOwnerAccess } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

function normalizeOptionalText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeHexColor(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return null;
  return trimmed;
}

const schema = z.object({
  bankHolder: z.string().trim().min(1),
  bankAlias: z.string().trim().min(1),
  bankCbu: z.string().trim().min(8),
  bankExtraNotes: z.preprocess(normalizeOptionalText, z.string().nullable()),
  transferDiscountPercent: z.coerce.number().int().min(0).max(90),
  mercadoPagoMarkupPercent: z.coerce.number().int().min(0).max(100),
  discountBadgeLabel: z.string().trim().min(1).max(80),
  themeBrandPrimary: z.preprocess(normalizeHexColor, z.string().nullable()),
  themeBrandDark: z.preprocess(normalizeHexColor, z.string().nullable()),
  themeBrandMuted: z.preprocess(normalizeHexColor, z.string().nullable()),
});

export async function GET() {
  await ensureStoreSettings();
  const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = { ...parsed.data };
  // Empleados / encargados no pueden cambiar datos bancarios (solo dueño)
  if (!isOwnerAccess(ctx)) {
    const current = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    data.bankHolder = current?.bankHolder ?? data.bankHolder;
    data.bankAlias = current?.bankAlias ?? data.bankAlias;
    data.bankCbu = current?.bankCbu ?? data.bankCbu;
    data.bankExtraNotes = current?.bankExtraNotes ?? data.bankExtraNotes;
  }

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json({ ok: true });
}
