import { randomBytes } from "crypto";
import { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

/** Tamaño máximo del archivo original antes de comprimir (bytes). */
const MAX_INPUT_BYTES = 12 * 1024 * 1024;

/** Lado máximo en px; encaja dentro manteniendo proporción. */
const MAX_SIDE = 1600;

/** Calidad WebP: equilibrio peso / calidad visual. */
const WEBP_QUALITY = 82;

/**
 * Guarda la imagen en `public/uploads/products/` como WebP comprimida.
 * Rota según EXIF. Devuelve la ruta pública (`/uploads/products/...`).
 *
 * Nota: en Vercel el filesystem es efímero; las subidas no persisten entre deploys.
 * Para producción serverless conviene más almacenamiento externo (S3, Blob, etc.).
 */
export async function saveCompressedProductImage(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_INPUT_BYTES) {
    throw new Error("La imagen supera el tamaño máximo permitido (12 MB).");
  }

  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
  const filepath = path.join(dir, filename);

  await sharp(buffer)
    .rotate()
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(filepath);

  return `/uploads/products/${filename}`;
}
