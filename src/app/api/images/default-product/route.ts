import { access } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CANDIDATES = [
  "/uploads/products/aqua_default.webp",
  "/uploads/products/aqua_default.png",
  "/uploads/products/aqua_default.jpg",
  "/uploads/products/aqua_default.jpeg",
  "/uploads/products/aqua_default",
  "/aqua_image.svg",
];

export async function GET(req: Request) {
  for (const publicPath of CANDIDATES) {
    const localPath = path.join(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
    try {
      await access(localPath);
      return NextResponse.redirect(new URL(publicPath, req.url));
    } catch {
      // Sigue al siguiente candidato.
    }
  }
  return NextResponse.json({ error: "No se encontró imagen predeterminada." }, { status: 404 });
}
