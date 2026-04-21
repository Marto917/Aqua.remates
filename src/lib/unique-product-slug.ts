import type { PrismaClient } from "@prisma/client";
import { slugify } from "@/lib/slugify";

/** Genera un slug único a partir del nombre (añade -1, -2 si hace falta). */
export async function ensureUniqueProductSlug(
  prisma: PrismaClient,
  name: string,
): Promise<string> {
  const base = slugify(name) || "producto";
  let candidate = base;
  let n = 1;
  for (;;) {
    const exists = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${base}-${n++}`;
  }
}
