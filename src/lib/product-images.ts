export const DEFAULT_PRODUCT_IMAGE = "/uploads/products/aqua-default.png";
export const ERROR_PRODUCT_IMAGE = "/uploads/products/aqua-error.png";

export function resolveProductImageUrl(imageUrl: string | null | undefined) {
  return imageUrl?.trim() || DEFAULT_PRODUCT_IMAGE;
}
