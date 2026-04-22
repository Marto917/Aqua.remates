import { slugify } from "@/lib/slugify";

export const CATEGORY_NAMES = [
  "bazar",
  "marroquineria",
  "blanqueria",
  "libreria",
  "vidrio",
  "baño",
  "plastico",
  "ferreteria",
  "cocina",
  "regaleria",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export function categorySlugFromName(name: string): string {
  return name === "baño" ? "banio" : slugify(name);
}

export const FIXED_CATEGORIES = CATEGORY_NAMES.map((name) => ({
  name,
  slug: categorySlugFromName(name),
}));
