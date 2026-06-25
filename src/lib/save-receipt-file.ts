import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { isCloudinaryConfigured, uploadRawToCloudinary, uploadWebpToCloudinary } from "@/lib/cloudinary-upload";

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_SIDE = 1600;
const WEBP_QUALITY = 82;

function getReceiptUploadsDir() {
  if (process.env.AQUA_RECEIPTS_DIR) {
    return process.env.AQUA_RECEIPTS_DIR;
  }
  return path.join(process.cwd(), "public", "uploads", "receipts");
}

export function getPublicReceiptPath(filename: string) {
  return `/uploads/receipts/${filename}`;
}

function isPdf(buffer: Buffer, mime: string): boolean {
  if (mime === "application/pdf") return true;
  return buffer.subarray(0, 5).toString() === "%PDF-";
}

function shouldUseCloudinary(): boolean {
  const mode = (process.env.STORAGE ?? "local").toLowerCase();
  return mode === "cloudinary" || isCloudinaryConfigured();
}

async function writeLocalReceipt(buffer: Buffer, filename: string): Promise<string> {
  const dir = getReceiptUploadsDir();
  const filepath = path.join(dir, filename);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filepath, buffer);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/read-only file system/i.test(msg) || /unable to open for write/i.test(msg)) {
      throw new Error(
        "No se pudo guardar el comprobante en el servidor. Configurá STORAGE=cloudinary en Railway.",
      );
    }
    throw error;
  }
  return getPublicReceiptPath(filename);
}

/** Guarda comprobante (PDF o imagen). En producción usa Cloudinary si está configurado. */
export async function saveTransferReceiptFile(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (buffer.length > MAX_INPUT_BYTES) {
    throw new Error("El archivo supera el tamaño máximo (12 MB).");
  }

  if (isPdf(buffer, mimeType)) {
    const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.pdf`;
    if (shouldUseCloudinary()) {
      return uploadRawToCloudinary(buffer, filename, "application/pdf");
    }
    return writeLocalReceipt(buffer, filename);
  }

  let webpBuffer: Buffer;
  try {
    webpBuffer = await sharp(buffer)
      .rotate()
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 2 })
      .toBuffer();
  } catch {
    throw new Error("No se pudo procesar la imagen. Probá con JPG o PNG.");
  }

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
  if (shouldUseCloudinary()) {
    return uploadWebpToCloudinary(webpBuffer, filename);
  }

  return writeLocalReceipt(webpBuffer, filename);
}
