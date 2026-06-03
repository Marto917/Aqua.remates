import type { CatalogVisibility, Prisma } from "@prisma/client";

export type CatalogAudience = "retail" | "wholesale";

const RETAIL: CatalogVisibility[] = ["PUBLIC_BOTH"];
const WHOLESALE: CatalogVisibility[] = ["PUBLIC_BOTH", "WHOLESALE_ONLY"];

export function catalogVisibilityWhere(
  audience: CatalogAudience = "retail",
): Prisma.ProductWhereInput {
  return {
    catalogVisibility: { in: audience === "wholesale" ? WHOLESALE : RETAIL },
  };
}

export function isProductVisibleToAudience(
  visibility: CatalogVisibility,
  audience: CatalogAudience,
): boolean {
  if (visibility === "HIDDEN") return false;
  if (audience === "wholesale") return visibility === "PUBLIC_BOTH" || visibility === "WHOLESALE_ONLY";
  return visibility === "PUBLIC_BOTH";
}

export const CATALOG_VISIBILITY_LABELS: Record<CatalogVisibility, string> = {
  PUBLIC_BOTH: "Minorista y mayorista",
  WHOLESALE_ONLY: "Solo mayorista",
  HIDDEN: "Oculto (staff)",
};
