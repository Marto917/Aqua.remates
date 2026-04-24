import path from "path";

/**
 * Directorio en disco donde se guardan imágenes de producto/variantes.
 * En Railway: montá un Volume apuntando a:
 *   <app>/public/uploads/products
 * y dejá esto por defecto (recomendado), o seteá AQUA_UPLOADS_DIR a una ruta absoluta.
 */
export function getProductUploadsDir() {
  if (process.env.AQUA_UPLOADS_DIR) {
    return process.env.AQUA_UPLOADS_DIR;
  }
  return path.join(process.cwd(), "public", "uploads", "products");
}

export function getPublicProductImagePath(filename: string) {
  return `/uploads/products/${filename}`;
}
