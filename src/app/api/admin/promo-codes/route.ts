import { PromoCodeRewardType, PromoCodeScopeType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { normalizePromoCodeInput } from "@/lib/promo-codes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function ensureCanManage() {
  const session = await getSafeSession();
  return (
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE
  );
}

const bodySchema = z.object({
  code: z.string().min(2).max(40),
  title: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  rewardType: z.enum(["PERCENT", "FIXED_AMOUNT"]),
  rewardValue: z.number().positive(),
  scopeType: z.enum(["ALL", "CATEGORIES", "PRODUCTS"]),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
});

export async function GET() {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const items = await prisma.promoCode.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json({
    items: items.map((i) => ({
      ...i,
      rewardValue: Number(i.rewardValue),
      categoryIds: i.categoryIds,
      productIds: i.productIds,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const code = normalizePromoCodeInput(parsed.data.code);
  if (parsed.data.rewardType === "PERCENT" && (parsed.data.rewardValue < 1 || parsed.data.rewardValue > 99)) {
    return NextResponse.json({ error: "El % debe ser entre 1 y 99." }, { status: 400 });
  }
  if (parsed.data.scopeType === "CATEGORIES" && !(parsed.data.categoryIds?.length)) {
    return NextResponse.json({ error: "Elegí al menos una categoría." }, { status: 400 });
  }
  if (parsed.data.scopeType === "PRODUCTS" && !(parsed.data.productIds?.length)) {
    return NextResponse.json({ error: "Elegí al menos un producto." }, { status: 400 });
  }

  const exists = await prisma.promoCode.findUnique({ where: { code } });
  if (exists) {
    return NextResponse.json({ error: "Ese código ya existe." }, { status: 409 });
  }

  const item = await prisma.promoCode.create({
    data: {
      code,
      title: parsed.data.title?.trim() || null,
      description: parsed.data.description?.trim() || null,
      rewardType: parsed.data.rewardType as PromoCodeRewardType,
      rewardValue: parsed.data.rewardValue,
      scopeType: parsed.data.scopeType as PromoCodeScopeType,
      categoryIds: parsed.data.scopeType === "CATEGORIES" ? parsed.data.categoryIds ?? [] : [],
      productIds: parsed.data.scopeType === "PRODUCTS" ? parsed.data.productIds ?? [] : [],
      isActive: parsed.data.isActive ?? true,
      maxUses: parsed.data.maxUses ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    item: { ...item, rewardValue: Number(item.rewardValue) },
  });
}
