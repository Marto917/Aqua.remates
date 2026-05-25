/** Mensaje legible para errores en acciones del panel (Prisma, validación, etc.). */
export function staffActionErrorMessage(e: unknown): string {
  const raw =
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : "No se pudo completar la operación.";

  if (
    raw.includes("transferProofUrl") ||
    raw.includes("transferProofUploadedAt") ||
    raw.includes("defaultShippingAddress") ||
    (raw.includes("column") && raw.includes("does not exist"))
  ) {
    return (
      "La base de datos en Neon no tiene las columnas nuevas. En Neon → SQL Editor ejecutá las migraciones " +
      "(comprobante de transferencia y perfil de envío). Pedile ayuda si no tenés acceso."
    );
  }

  return raw;
}
