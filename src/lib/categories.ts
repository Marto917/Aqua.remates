import { slugify } from "@/lib/slugify";

export const CATEGORY_NAMES = [
  "Bazar",
  "Marroquineria",
  "Blanqueria",
  "Libreria",
  "Vidrio",
  "Banio",
  "Plastico",
  "Ferreteria",
  "Cocina",
  "Regaleria",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export const FIXED_CATEGORIES = CATEGORY_NAMES.map((name) => ({
  name,
  slug: slugify(name),
}));
