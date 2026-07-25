import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluatePromoCode } from "@/lib/promo-codes";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().min(1),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        categoryId: z.string().min(1),
        lineTotal: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const result = await evaluatePromoCode(parsed.data.code, parsed.data.lines);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    title: result.title,
    discountAmount: result.discountAmount,
    message: result.message,
    rewardType: result.rewardType,
    rewardValue: result.rewardValue,
  });
}
