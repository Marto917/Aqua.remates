type ProductLike = {
  sku: string | null;
  description: string;
  imageUrl: string;
  listPrice: { toString(): string } | number;
  retailPrice: { toString(): string } | number;
  wholesalePrice: { toString(): string } | number;
  variants: { isActive: boolean }[];
};

export function getProductCompletenessIssues(product: ProductLike): string[] {
  const issues: string[] = [];
  if (!product.sku?.trim()) issues.push("Código de barra");
  if (!product.description?.trim()) issues.push("Descripción");
  if (!product.imageUrl?.trim()) issues.push("Imagen");
  if (Number(product.listPrice) <= 0) issues.push("Precio lista");
  if (Number(product.retailPrice) <= 0) issues.push("Precio transferencia");
  if (Number(product.wholesalePrice) <= 0) issues.push("Precio mayorista");
  if (!product.variants.some((v) => v.isActive)) issues.push("Color activo");
  return issues;
}

export function isProductComplete(product: ProductLike): boolean {
  return getProductCompletenessIssues(product).length === 0;
}
