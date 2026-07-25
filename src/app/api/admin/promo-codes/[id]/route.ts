import { PromoCodeRewardType, PromoCodeScopeType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { normalizePromoCodeInput } from "@/lib/promo-codes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function ensureCanManage() {
  const session = await getSafeSession();
  return (
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE
  );
}

const bodySchema = z.object({
  code: z.string().min(2).max(40).optional(),
  title: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  rewardType: z.enum(["PERCENT", "FIXED_AMOUNT"]).optional(),
  rewardValue: z.number().positive().optional(),
  scopeType: z.enum(["ALL", "CATEGORIES", "PRODUCTS"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
});

export async function PATCH(req: Request, context: RouteContext) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const rewardType = (parsed.data.rewardType ?? existing.rewardType) as PromoCodeRewardType;
  const rewardValue = parsed.data.rewardValue ?? Number(existing.rewardValue);
  const scopeType = (parsed.data.scopeType ?? existing.scopeType) as PromoCodeScopeType;

  if (rewardType === "PERCENT" && (rewardValue < 1 || rewardValue > 99)) {
    return NextResponse.json({ error: "El % debe ser entre 1 y 99." }, { status: 400 });
  }

  let code = existing.code;
  if (parsed.data.code) {
    code = normalizePromoCodeInput(parsed.data.code);
    if (code !== existing.code) {
      const clash = await prisma.promoCode.findUnique({ where: { code } });
      if (clash) {
        return NextResponse.json({ error: "Ese código ya existe." }, { status: 409 });
      }
    }
  }

  const item = await prisma.promoCode.update({
    where: { id },
    data: {
      code,
      title: parsed.data.title !== undefined ? parsed.data.title?.trim() || null : undefined,
      description:
        parsed.data.description !== undefined ? parsed.data.description?.trim() || null : undefined,
      rewardType,
      rewardValue,
      scopeType,
      categoryIds:
        scopeType === "CATEGORIES"
          ? (parsed.data.categoryIds ?? (existing.categoryIds as string[] | null) ?? [])
          : [],
      productIds:
        scopeType === "PRODUCTS"
          ? (parsed.data.productIds ?? (existing.productIds as string[] | null) ?? [])
          : [],
      isActive: parsed.data.isActive,
      maxUses: parsed.data.maxUses === undefined ? undefined : parsed.data.maxUses,
    },
  });

  return NextResponse.json({ ok: true, item: { ...item, rewardValue: Number(item.rewardValue) } });
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  await prisma.promoCode.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
