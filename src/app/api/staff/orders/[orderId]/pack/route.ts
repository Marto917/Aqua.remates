import { NextResponse } from "next/server";
import { markOrderPackedAction } from "@/app/(staff)/vendedor/envios/actions";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const result = await markOrderPackedAction(orderId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
