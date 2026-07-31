import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getProductUploadsDir, getPublicProductImagePath } from "@/lib/uploads-paths";

/** Tamaño máximo del archivo original antes de comprimir (bytes). */
const MAX_INPUT_BYTES = 12 * 1024 * 1024;

/** Lado máximo en px (productos); encaja dentro manteniendo proporción. */
const DEFAULT_MAX_SIDE = 1600;

/** Calidad WebP: equilibrio peso / calidad visual. */
const WEBP_QUALITY = 82;

type SaveImageOptions = {
  /** Lado máximo en px. Banners/promos: usar 1920 para respetar las medidas recomendadas. */
  maxSide?: number;
};

/**
 * Guarda la imagen en `public/uploads/products/` como WebP comprimida.
 * Rota según EXIF. Devuelve la ruta pública (`/uploads/products/...`) o una URL
 * remota (si configurás almacenamiento en Cloudinary).
 */
export async function saveCompressedProductImage(
  buffer: Buffer,
  options?: SaveImageOptions,
): Promise<string> {
  if (buffer.length > MAX_INPUT_BYTES) {
    throw new Error("La imagen supera el tamaño máximo permitido (12 MB).");
  }

  const maxSide = Math.max(400, Math.min(options?.maxSide ?? DEFAULT_MAX_SIDE, 2560));
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
  const dir = getProductUploadsDir();
  const filepath = path.join(dir, filename);

  const webpBuffer: Buffer = await sharp(buffer)
    .rotate()
    .resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  const mode = (process.env.STORAGE ?? "local").toLowerCase();
  if (mode === "cloudinary") {
    const { uploadWebpToCloudinary } = await import("@/lib/cloudinary-upload");
    return await uploadWebpToCloudinary(webpBuffer, filename);
  }

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filepath, webpBuffer);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/read-only file system/i.test(msg) || /unable to open for write/i.test(msg)) {
      throw new Error(
        "No se pudo escribir en disco. En Railway, montá un Volume en la carpeta de uploads (por ejemplo <app>/public/uploads/products) o usá almacenamiento remoto (opcional, STORAGE=cloudinary).",
      );
    }
    throw error;
  }

  return getPublicProductImagePath(filename);
}
