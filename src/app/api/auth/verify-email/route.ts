import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { buildPublicUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plainToken = searchParams.get("token");
  if (!plainToken) {
    return NextResponse.redirect(buildPublicUrl("/cuenta/verificar-email", { estado: "error" }));
  }

  const emailVerificationTokenHash = createHash("sha256").update(plainToken).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash,
      emailVerificationExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.redirect(buildPublicUrl("/cuenta/verificar-email", { estado: "expirado" }));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
    },
  });

  return NextResponse.redirect(buildPublicUrl("/cuenta/verificar-email", { estado: "ok" }));
}
