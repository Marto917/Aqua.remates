import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_SIDE = 2000;
const WEBP_QUALITY = 85;

function getReceiptUploadsDir() {
  if (process.env.AQUA_RECEIPTS_DIR) {
    return process.env.AQUA_RECEIPTS_DIR;
  }
  return path.join(process.cwd(), "public", "uploads", "receipts");
}

export function getPublicReceiptPath(filename: string) {
  return `/uploads/receipts/${filename}`;
}

/** Guarda comprobante de transferencia como WebP en public/uploads/receipts/. */
export async function saveTransferReceiptImage(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_INPUT_BYTES) {
    throw new Error("El archivo supera el tamaño máximo (12 MB).");
  }

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
  const dir = getReceiptUploadsDir();
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);

  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  const mode = (process.env.STORAGE ?? "local").toLowerCase();
  if (mode === "cloudinary") {
    const { uploadWebpToCloudinary } = await import("@/lib/cloudinary-upload");
    return await uploadWebpToCloudinary(webpBuffer, `receipt-${filename}`);
  }

  await writeFile(filepath, webpBuffer);
  return getPublicReceiptPath(filename);
}
