import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function scoreMatch(term: string, ...fields: (string | null | undefined)[]): number {
  const t = term.toLowerCase();
  let score = 0;
  for (const f of fields) {
    if (!f) continue;
    const v = f.toLowerCase();
    if (v === t) score += 100;
    else if (v.startsWith(t)) score += 60;
    else if (v.includes(t)) score += 30;
    else if (t.split(/\s+/).every((w) => v.includes(w))) score += 20;
  }
  return score;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      description: true,
      category: { select: { name: true } },
    },
    take: 24,
  });

  const ranked = products
    .map((p) => ({
      ...p,
      _score: scoreMatch(q, p.name, p.sku, p.description, p.category.name),
    }))
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map(({ id, slug, name, sku, category }) => ({
      id,
      slug,
      name,
      sku,
      category: category.name,
    }));

  return NextResponse.json({ items: ranked });
}
