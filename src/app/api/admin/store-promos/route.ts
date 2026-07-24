import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";
import { slugifyPromoTitle } from "@/lib/store-promo";

export const runtime = "nodejs";

async function ensureCanManage() {
  const session = await getSafeSession();
  return (
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE
  );
}

export async function GET() {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const items = await prisma.storePromo.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await req.formData();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !summary || !body) {
    return NextResponse.json(
      { error: "Completá título, resumen y descripción/términos." },
      { status: 400 },
    );
  }

  let slug = String(formData.get("slug") ?? "").trim() || slugifyPromoTitle(title);
  slug = slugifyPromoTitle(slug);

  const existing = await prisma.storePromo.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  let logoUrl: string | null = null;
  const file = formData.get("logoFile");
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    logoUrl = await saveCompressedProductImage(buffer);
  }

  const sortOrder = Number(String(formData.get("sortOrder") ?? "0")) || 0;
  const published = String(formData.get("published") ?? "on") === "on";

  const item = await prisma.storePromo.create({
    data: {
      title,
      summary,
      body,
      slug,
      logoUrl,
      sortOrder,
      published,
    },
  });

  return NextResponse.json({ ok: true, item });
}
