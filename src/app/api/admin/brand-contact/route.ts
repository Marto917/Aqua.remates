import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeSocialUrl } from "@/lib/brand-contact";
import { canStaffAccess, getStaffContext } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

const optionalText = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? null : String(v).trim() || null),
  z.string().nullable(),
);

const schema = z.object({
  storePhone: optionalText,
  storeInstagram: optionalText,
  storeTiktok: optionalText,
  storeAddress: optionalText,
});

export async function POST(req: Request) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  await ensureStoreSettings();
  await prisma.storeSettings.update({
    where: { id: "default" },
    data: {
      storePhone: parsed.data.storePhone,
      storeInstagram: normalizeSocialUrl(parsed.data.storeInstagram, "instagram"),
      storeTiktok: normalizeSocialUrl(parsed.data.storeTiktok, "tiktok"),
      storeAddress: parsed.data.storeAddress,
    },
  });

  return NextResponse.json({ ok: true });
}
