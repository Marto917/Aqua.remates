import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDemoSeed } from "@/lib/run-demo-seed";

/**
 * Carga usuarios y productos demo en la base actual.
 * - Producción: body JSON `{ "secret": "<SETUP_SECRET>" }` (misma variable en Vercel).
 * - Desarrollo local: si no hay SETUP_SECRET, se acepta sin clave (solo para poblar tu DB).
 */
export async function POST(req: Request) {
  const envSecret = process.env.SETUP_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  const devAllowNoSecret = !isProd && !envSecret;

  if (isProd && !envSecret) {
    return NextResponse.json(
      {
        error:
          "SETUP_SECRET no está definido en el servidor. Agregalo en el hosting (Vercel → Environment Variables) y volvé a desplegar.",
      },
      { status: 503 },
    );
  }

  let body: { secret?: string } = {};
  try {
    body = (await req.json()) as { secret?: string };
  } catch {
    body = {};
  }

  const provided = typeof body.secret === "string" ? body.secret : "";
  const authorized =
    devAllowNoSecret || (Boolean(envSecret) && provided === envSecret);

  if (!authorized) {
    return NextResponse.json(
      { error: "No autorizado. Revisá la clave o configurá SETUP_SECRET." },
      { status: 401 },
    );
  }

  try {
    await runDemoSeed(prisma);
    return NextResponse.json({
      ok: true,
      message:
        "Datos demo cargados. Podés iniciar sesión con owner@aqua.local / Owner1234.",
    });
  } catch (e) {
    console.error("[setup-demo]", e);
    return NextResponse.json(
      { error: "No se pudo ejecutar el seed. Revisá DATABASE_URL y los logs." },
      { status: 500 },
    );
  }
}
