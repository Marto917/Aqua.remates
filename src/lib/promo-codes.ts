import type { PromoCode, PromoCodeRewardType, PromoCodeScopeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PromoCodeCartLine = {
  productId: string;
  categoryId: string;
  lineTotal: number;
};

export type PromoCodeEvaluation = {
  ok: true;
  code: string;
  title: string | null;
  rewardType: PromoCodeRewardType;
  rewardValue: number;
  scopeType: PromoCodeScopeType;
  eligibleSubtotal: number;
  discountAmount: number;
  message: string;
} | {
  ok: false;
  error: string;
};

function parseIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function normalizePromoCodeInput(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function isPromoCodeCurrentlyValid(row: Pick<PromoCode, "isActive" | "startsAt" | "endsAt" | "maxUses" | "usedCount">): boolean {
  if (!row.isActive) return false;
  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) return false;
  if (row.endsAt && row.endsAt.getTime() < now) return false;
  if (row.maxUses != null && row.usedCount >= row.maxUses) return false;
  return true;
}

function eligibleSubtotal(row: PromoCode, lines: PromoCodeCartLine[]): number {
  const categoryIds = new Set(parseIdList(row.categoryIds));
  const productIds = new Set(parseIdList(row.productIds));

  return lines.reduce((sum, line) => {
    if (row.scopeType === "ALL") return sum + line.lineTotal;
    if (row.scopeType === "CATEGORIES") {
      return categoryIds.has(line.categoryId) ? sum + line.lineTotal : sum;
    }
    if (row.scopeType === "PRODUCTS") {
      return productIds.has(line.productId) ? sum + line.lineTotal : sum;
    }
    return sum;
  }, 0);
}

function computeDiscount(row: PromoCode, eligible: number): number {
  if (eligible <= 0) return 0;
  const value = Number(row.rewardValue);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (row.rewardType === "PERCENT") {
    const pct = Math.min(99, Math.max(0, value));
    return Math.round(eligible * (pct / 100) * 100) / 100;
  }
  return Math.min(eligible, Math.round(value * 100) / 100);
}

function describeReward(row: PromoCode): string {
  const value = Number(row.rewardValue);
  if (row.rewardType === "PERCENT") {
    return `${value}% de descuento`;
  }
  return `$${value.toLocaleString("es-AR")} a favor`;
}

export async function evaluatePromoCode(
  rawCode: string,
  lines: PromoCodeCartLine[],
): Promise<PromoCodeEvaluation> {
  const code = normalizePromoCodeInput(rawCode);
  if (!code) {
    return { ok: false, error: "Ingresá un código." };
  }

  const row = await prisma.promoCode.findUnique({ where: { code } });
  if (!row || !isPromoCodeCurrentlyValid(row)) {
    return { ok: false, error: "Código inválido o vencido." };
  }

  const eligible = eligibleSubtotal(row, lines);
  if (eligible <= 0.01) {
    return {
      ok: false,
      error: "Este código no aplica a los productos de tu carrito.",
    };
  }

  const discountAmount = computeDiscount(row, eligible);
  if (discountAmount <= 0) {
    return { ok: false, error: "Este código no genera descuento en este pedido." };
  }

  return {
    ok: true,
    code: row.code,
    title: row.title,
    rewardType: row.rewardType,
    rewardValue: Number(row.rewardValue),
    scopeType: row.scopeType,
    eligibleSubtotal: eligible,
    discountAmount,
    message: `${describeReward(row)} aplicado${row.title ? `: ${row.title}` : ""}`,
  };
}

export async function incrementPromoCodeUse(code: string): Promise<void> {
  const normalized = normalizePromoCodeInput(code);
  if (!normalized) return;
  await prisma.promoCode
    .update({
      where: { code: normalized },
      data: { usedCount: { increment: 1 } },
    })
    .catch(() => undefined);
}
