import { NextResponse } from "next/server";

/** @deprecated Usar POST /api/retail-checkout con el carrito. */
export async function POST() {
  return NextResponse.json(
    { error: "Este endpoint fue reemplazado. Usá el checkout desde el carrito." },
    { status: 410 },
  );
}
