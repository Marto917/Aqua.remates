import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ensureStoreSettings } from "@/lib/store-settings";

const schema = z.object({
  enabled: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getSafeSession();
  if (session?.user?.role !== UserRole.OWNER) {
    return NextResponse.json({ error: "Solo el administrador puede cambiar esto." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  await ensureStoreSettings();
  await prisma.storeSettings.update({
    where: { id: "default" },
    data: { ridersAppEnabled: parsed.data.enabled },
  });

  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}
