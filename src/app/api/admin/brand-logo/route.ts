import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { saveCompressedProductImage } from "@/lib/save-product-image";
import { ensureStoreSettings } from "@/lib/store-settings";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSafeSession();
  const role = session?.user?.role;
  if (role !== UserRole.OWNER && role !== UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  await ensureStoreSettings();
  const formData = await req.formData();
  const clear = formData.get("clearLogo") === "on";
  const file = formData.get("brandLogo");

  let brandLogoUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    brandLogoUrl = await saveCompressedProductImage(buffer);
  } else if (!clear) {
    const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    brandLogoUrl = row?.brandLogoUrl ?? null;
  }

  await prisma.storeSettings.update({
    where: { id: "default" },
    data: { brandLogoUrl },
  });

  return NextResponse.json({ ok: true, brandLogoUrl });
}
