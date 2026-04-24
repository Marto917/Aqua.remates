export const DEFAULT_PRODUCT_IMAGE = "/uploads/products/aqua_default.png";
export const ERROR_PRODUCT_IMAGE = "/uploads/products/aqua_default.png";

const LEGACY_DEFAULT_PATHS = new Set([
  "/api/images/default-product",
  "/uploads/products/aqua-default.png",
  "/uploads/products/aqua-error.png",
  "/uploads/products/aqua_default",
  "/uploads/products/aqua_default.png",
  "/uploads/products/aqua_default.jpg",
  "/uploads/products/aqua_default.webp",
  "/aqua_image.webp",
  "/aqua_image.png",
  "/aqua_image.jpg",
]);

/**
 * Resuelve URL pública o remota. Rutas heredadas o vacías → imagen local por defecto.
 */
export function resolveProductImageUrl(imageUrl: string | null | undefined) {
  const v = imageUrl?.trim();
  if (!v) return DEFAULT_PRODUCT_IMAGE;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (LEGACY_DEFAULT_PATHS.has(v)) return DEFAULT_PRODUCT_IMAGE;
  return v.startsWith("/") ? v : `/${v.replace(/^\/+/, "")}`;
}
