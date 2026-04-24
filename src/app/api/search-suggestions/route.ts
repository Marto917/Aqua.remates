import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.product.findMany({
    where: { isActive: true, name: { contains: q, mode: "insensitive" } },
    select: { id: true, slug: true, name: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 6,
  });

  return NextResponse.json({ items });
}
