import { createHash, randomBytes } from "crypto";

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

function getCloudName(): string {
  if (process.env.CLOUDINARY_CLOUD_NAME) return process.env.CLOUDINARY_CLOUD_NAME;
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return "";
  try {
    const u = new URL(raw);
    return u.hostname;
  } catch {
    return "";
  }
}

function buildSignature(params: Record<string, string>, apiSecret: string) {
  const paramString = Object.keys(params)
    .filter((k) => k !== "file")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(paramString + apiSecret).digest("hex");
}

/**
 * Sube un WebP ya generado a Cloudinary y devuelve `secure_url` (https).
 * Soporta:
 * - upload preset no firmado: CLOUDINARY_UNSIGNED_PRESET
 * - subida firmada: CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 */
export async function uploadWebpToCloudinary(webpBuffer: Buffer, filename: string) {
  const cloudName = getCloudName();
  if (!cloudName) {
    throw new Error("Falta CLOUDINARY_CLOUD_NAME o CLOUDINARY_URL con cloud name.");
  }

  const unsignedPreset = process.env.CLOUDINARY_UNSIGNED_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER ?? "aqua/products";

  const publicId = `${Date.now()}-${randomBytes(3).toString("hex")}`;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(webpBuffer)], { type: "image/webp" }), filename);

  if (unsignedPreset) {
    // Modo más simple: el upload preset controla carpeta / reglas. Evitamos mezclar parámetros
    // que el preset no permita.
    form.append("upload_preset", unsignedPreset);
    form.append("public_id", publicId);
  } else if (apiKey && apiSecret) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params: Record<string, string> = {
      folder,
      public_id: publicId,
      timestamp,
    };
    const signature = buildSignature(params, apiSecret);
    form.append("folder", folder);
    form.append("public_id", publicId);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("signature", signature);
  } else {
    throw new Error(
      "Configurá Cloudinary: o bien CLOUDINARY_UNSIGNED_PRESET, o CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.",
    );
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as CloudinaryUploadResponse;
  if (!res.ok || !data.secure_url) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`No se pudo subir a Cloudinary: ${msg}`);
  }

  return data.secure_url;
}
