export type BannerPlacement = "carousel" | "promo";

const PROMO_BASE = 1000;

export function placementFromSortOrder(sortOrder: number): BannerPlacement {
  return sortOrder >= PROMO_BASE ? "promo" : "carousel";
}

export function sortOrderForPlacement(
  placement: BannerPlacement,
  order: number,
): number {
  const safeOrder = Number.isFinite(order) ? Math.max(0, Math.floor(order)) : 0;
  if (placement === "promo") return PROMO_BASE + safeOrder;
  return safeOrder;
}

export function placementOrder(sortOrder: number): number {
  if (sortOrder >= PROMO_BASE) return sortOrder - PROMO_BASE;
  return sortOrder;
}
