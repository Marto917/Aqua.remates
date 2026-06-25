import { createHash, randomBytes } from "crypto";

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

export function getCloudName(): string {
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

export function isCloudinaryConfigured(): boolean {
  const cloudName = getCloudName();
  if (!cloudName) return false;
  return Boolean(
    process.env.CLOUDINARY_UNSIGNED_PRESET ||
      (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  );
}

function buildSignature(params: Record<string, string>, apiSecret: string) {
  const paramString = Object.keys(params)
    .filter((k) => k !== "file")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(paramString + apiSecret).digest("hex");
}

type UploadOptions = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder: string;
  resourceType: "image" | "raw";
};

async function uploadBufferToCloudinary({
  buffer,
  filename,
  mimeType,
  folder,
  resourceType,
}: UploadOptions): Promise<string> {
  const cloudName = getCloudName();
  if (!cloudName) {
    throw new Error("Falta CLOUDINARY_CLOUD_NAME o CLOUDINARY_URL con cloud name.");
  }

  const unsignedPreset = process.env.CLOUDINARY_UNSIGNED_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const publicId = `${Date.now()}-${randomBytes(3).toString("hex")}`;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

  if (unsignedPreset) {
    form.append("upload_preset", unsignedPreset);
    form.append("public_id", publicId);
    if (resourceType === "raw") {
      form.append("resource_type", "raw");
    }
  } else if (apiKey && apiSecret) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params: Record<string, string> = {
      folder,
      public_id: publicId,
      timestamp,
    };
    if (resourceType === "raw") {
      params.resource_type = "raw";
    }
    const signature = buildSignature(params, apiSecret);
    form.append("folder", folder);
    form.append("public_id", publicId);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("signature", signature);
    if (resourceType === "raw") {
      form.append("resource_type", "raw");
    }
  } else {
    throw new Error(
      "Configurá Cloudinary: o bien CLOUDINARY_UNSIGNED_PRESET, o CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.",
    );
  }

  const endpoint =
    resourceType === "raw"
      ? `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
      : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as CloudinaryUploadResponse;
  if (!res.ok || !data.secure_url) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`No se pudo subir a Cloudinary: ${msg}`);
  }

  return data.secure_url;
}

/**
 * Sube un WebP ya generado a Cloudinary y devuelve `secure_url` (https).
 */
export async function uploadWebpToCloudinary(webpBuffer: Buffer, filename: string) {
  const folder = process.env.CLOUDINARY_FOLDER ?? "aqua/products";
  return uploadBufferToCloudinary({
    buffer: webpBuffer,
    filename,
    mimeType: "image/webp",
    folder,
    resourceType: "image",
  });
}

/** Sube PDF u otro archivo binario como recurso raw. */
export async function uploadRawToCloudinary(buffer: Buffer, filename: string, mimeType: string) {
  const folder = process.env.CLOUDINARY_RECEIPTS_FOLDER ?? "aqua/receipts";
  return uploadBufferToCloudinary({
    buffer,
    filename,
    mimeType,
    folder,
    resourceType: "raw",
  });
}
