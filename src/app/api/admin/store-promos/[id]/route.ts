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

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const existing = await prisma.storePromo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  const formData = await req.formData();
  const title = String(formData.get("title") ?? existing.title).trim();
  const summary = String(formData.get("summary") ?? existing.summary).trim();
  const body = String(formData.get("body") ?? existing.body).trim();
  let slug =
    String(formData.get("slug") ?? existing.slug).trim() || slugifyPromoTitle(title);
  slug = slugifyPromoTitle(slug);

  if (slug !== existing.slug) {
    const clash = await prisma.storePromo.findUnique({ where: { slug } });
    if (clash) {
      return NextResponse.json({ error: "Ese slug ya existe." }, { status: 400 });
    }
  }

  let logoUrl = existing.logoUrl;
  const file = formData.get("logoFile");
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    logoUrl = await saveCompressedProductImage(buffer);
  }

  const sortOrderRaw = formData.get("sortOrder");
  const sortOrder =
    sortOrderRaw != null && String(sortOrderRaw).trim() !== ""
      ? Number(String(sortOrderRaw)) || 0
      : existing.sortOrder;
  const published =
    formData.getAll("published").includes("on") ||
    String(formData.get("published")) === "true";

  const item = await prisma.storePromo.update({
    where: { id },
    data: { title, summary, body, slug, logoUrl, sortOrder, published },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  await prisma.storePromo.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
