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
  const clear = formData.get("clearFooter") === "on";
  const file = formData.get("footerImage");

  let footerImageUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    footerImageUrl = await saveCompressedProductImage(buffer);
  } else if (!clear) {
    const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    footerImageUrl = row?.footerImageUrl ?? null;
  }

  await prisma.storeSettings.update({
    where: { id: "default" },
    data: { footerImageUrl },
  });

  return NextResponse.json({ ok: true, footerImageUrl });
}
