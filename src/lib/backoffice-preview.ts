/**
 * Mientras no haya login definitivo: con BACKOFFICE_PREVIEW en .env
 * se permite entrar a /admin y /vendedor y las APIs de backoffice sin sesión.
 * Acepta true / 1 / yes (mayúsculas o no). También NEXT_PUBLIC_BACKOFFICE_PREVIEW por si solo está en el cliente.
 * En producción real: no definir esta variable (o ponerla en false).
 */
export function isBackofficePreview(): boolean {
  const raw =
    process.env.BACKOFFICE_PREVIEW ?? process.env.NEXT_PUBLIC_BACKOFFICE_PREVIEW;
  const v = raw?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "si" || v === "sí";
}
