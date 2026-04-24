export const DEFAULT_PRODUCT_IMAGE = "/aqua_image.webp";
export const ERROR_PRODUCT_IMAGE = "/aqua_image.webp";

export function resolveProductImageUrl(imageUrl: string | null | undefined) {
  const v = imageUrl?.trim();
  if (!v) return DEFAULT_PRODUCT_IMAGE;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return v;
}
