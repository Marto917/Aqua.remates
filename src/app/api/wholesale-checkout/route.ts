import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Las ventas mayoristas estarán disponibles próximamente." },
    { status: 503 },
  );
}
