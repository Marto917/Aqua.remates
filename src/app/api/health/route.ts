import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Comprobación rápida de deploy: DB alcanzable y variables críticas presentes.
 * No expone secretos; útil cuando el login falla y hay que ver si la app ve la misma DB que vos en local.
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasNextAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    ok: hasDatabaseUrl && hasNextAuthSecret && dbOk,
    hasDatabaseUrl,
    hasNextAuthSecret,
    hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    dbReachable: dbOk,
  });
}
