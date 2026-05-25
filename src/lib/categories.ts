import { slugify } from "@/lib/slugify";

/** Categorías base (sin cocina ni herramientas; migrar a bazar / ferretería). */
export const DEFAULT_CATEGORY_NAMES = [
  "bazar",
  "marroquineria",
  "blanqueria",
  "libreria",
  "vidrio",
  "baño",
  "plastico",
  "ferreteria",
  "regaleria",
] as const;

export type DefaultCategoryName = (typeof DEFAULT_CATEGORY_NAMES)[number];

export function categorySlugFromName(name: string): string {
  return name === "baño" ? "banio" : slugify(name);
}
