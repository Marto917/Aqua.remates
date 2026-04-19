/**
 * Mientras no haya login definitivo: con BACKOFFICE_PREVIEW=true en .env
 * se permite entrar a /admin y /vendedor y las APIs de backoffice sin sesión.
 * En producción real: no definir esta variable (o ponerla en false).
 */
export function isBackofficePreview(): boolean {
  return process.env.BACKOFFICE_PREVIEW === "true";
}
