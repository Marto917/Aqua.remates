import { NextResponse } from "next/server";
import { canStaffAccess, getStaffContext } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";
import { saveCompressedProductImage } from "@/lib/save-product-image";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  await ensureStoreSettings();
  const formData = await req.formData();
  const clear = String(formData.get("clear") ?? "") === "1";
  const linkRaw = String(formData.get("linkUrl") ?? "").trim();
  const linkUrl = linkRaw.length > 0 ? linkRaw : null;
  const image = formData.get("image");

  const current = await prisma.storeSettings.findUnique({
    where: { id: "default" },
    select: { homeRibbonImageUrl: true },
  });

  let homeRibbonImageUrl = current?.homeRibbonImageUrl ?? null;
  if (clear) {
    homeRibbonImageUrl = null;
  } else if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Subí una imagen (JPG, PNG o WebP)." }, { status: 400 });
    }
    const buffer = Buffer.from(await image.arrayBuffer());
    homeRibbonImageUrl = await saveCompressedProductImage(buffer);
  }

  const updated = await prisma.storeSettings.update({
    where: { id: "default" },
    data: { homeRibbonImageUrl, homeRibbonLinkUrl: linkUrl },
    select: { homeRibbonImageUrl: true, homeRibbonLinkUrl: true },
  });

  return NextResponse.json({
    ok: true,
    imageUrl: updated.homeRibbonImageUrl,
    linkUrl: updated.homeRibbonLinkUrl,
  });
}
