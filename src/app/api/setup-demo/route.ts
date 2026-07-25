import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDemoSeed } from "@/lib/run-demo-seed";

/**
 * Carga catálogo demo (categorías/productos) en la base actual.
 * - Producción: body JSON `{ "secret": "<SETUP_SECRET>" }` (misma variable en el hosting).
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
          "SETUP_SECRET no está definido en el servidor. Agregalo en el hosting y volvé a desplegar.",
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
      message: "Catálogo demo cargado. No se crearon usuarios ni contraseñas.",
    });
  } catch (e) {
    console.error("[setup-demo]", e);
    return NextResponse.json(
      { error: "No se pudo ejecutar el seed. Revisá DATABASE_URL y los logs." },
      { status: 500 },
    );
  }
}
