/**
 * Preview sin login: solo en desarrollo local.
 * En producción siempre devuelve false (no usar BACKOFFICE_PREVIEW en Railway).
 */
export function isBackofficePreview(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const raw =
    process.env.BACKOFFICE_PREVIEW ?? process.env.NEXT_PUBLIC_BACKOFFICE_PREVIEW;
  const v = raw?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "si" || v === "sí";
}
