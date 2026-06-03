import { NextResponse } from "next/server";
import { runDataRetention } from "@/lib/data-retention";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV === "development";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const result = await runDataRetention();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/data-retention]", error);
    return NextResponse.json({ error: "Error al ejecutar limpieza." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
