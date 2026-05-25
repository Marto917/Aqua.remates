/**
 * Preview sin login: solo en desarrollo y con ALLOW explícito.
 * En producción no usar BACKOFFICE_PREVIEW (riesgo de acceso al panel sin sesión).
 */
export function isBackofficePreview(): boolean {
  if (process.env.NODE_ENV === "production") {
    const allow = process.env.ALLOW_BACKOFFICE_PREVIEW?.trim().toLowerCase();
    if (allow !== "true" && allow !== "1" && allow !== "yes") {
      return false;
    }
  }
  const raw =
    process.env.BACKOFFICE_PREVIEW ?? process.env.NEXT_PUBLIC_BACKOFFICE_PREVIEW;
  const v = raw?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "si" || v === "sí";
}
