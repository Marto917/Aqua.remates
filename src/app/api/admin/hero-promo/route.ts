import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { getHeroPromoSettings } from "@/lib/hero-promo";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";
import { ensureStoreSettings } from "@/lib/store-settings";

export const runtime = "nodejs";

async function ensureCanManage() {
  const session = await getSafeSession();
  const role = session?.user?.role;
  return role === UserRole.OWNER || role === UserRole.EMPLOYEE;
}

export async function GET() {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const settings = await getHeroPromoSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: Request) {
  if (!(await ensureCanManage())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  await ensureStoreSettings();

  const formData = await req.formData();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const clearDesktop = formData.get("clearDesktop") === "on";
  const clearMobile = formData.get("clearMobile") === "on";

  const current = await getHeroPromoSettings();
  let desktopImageUrl = current.desktopImageUrl;
  let mobileImageUrl = current.mobileImageUrl;

  const desktopFile = formData.get("desktopImage");
  if (desktopFile instanceof File && desktopFile.size > 0) {
    const buffer = Buffer.from(await desktopFile.arrayBuffer());
    desktopImageUrl = await saveCompressedProductImage(buffer, { maxSide: 1920 });
  } else if (clearDesktop) {
    desktopImageUrl = null;
  }

  const mobileFile = formData.get("mobileImage");
  if (mobileFile instanceof File && mobileFile.size > 0) {
    const buffer = Buffer.from(await mobileFile.arrayBuffer());
    mobileImageUrl = await saveCompressedProductImage(buffer, { maxSide: 1920 });
  } else if (clearMobile) {
    mobileImageUrl = null;
  }

  await prisma.storeSettings.update({
    where: { id: "default" },
    data: {
      heroPromoDesktopImageUrl: desktopImageUrl,
      heroPromoMobileImageUrl: mobileImageUrl,
      heroPromoLinkUrl: linkUrl,
    },
  });

  const settings = await getHeroPromoSettings();
  return NextResponse.json({ ok: true, settings });
}
