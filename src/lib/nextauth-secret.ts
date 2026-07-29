/**
 * Validación de NEXTAUTH_SECRET.
 * No loguea el valor del secret; solo avisos de configuración insegura.
 */

/** Valores que alguna vez estuvieron en docs/ejemplos y nunca deben usarse en prod. */
const KNOWN_INSECURE_SECRETS = new Set([
  "1baab0bcfb3207cbc8a11f897e66679b1109b72911c29baa982a21bb9b36bb3d",
  "changeme",
  "secret",
  "nextauth-secret",
  "NEXTAUTH_SECRET",
]);

const MIN_SECRET_LENGTH = 32;

export type NextAuthSecretStatus = {
  present: boolean;
  secure: boolean;
  reason: string | null;
};

export function getNextAuthSecretStatus(): NextAuthSecretStatus {
  const secret = process.env.NEXTAUTH_SECRET?.trim() ?? "";
  if (!secret) {
    return {
      present: false,
      secure: false,
      reason: "NEXTAUTH_SECRET no está definida.",
    };
  }
  if (KNOWN_INSECURE_SECRETS.has(secret)) {
    return {
      present: true,
      secure: false,
      reason: "NEXTAUTH_SECRET coincide con un valor de ejemplo / inseguro.",
    };
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    return {
      present: true,
      secure: false,
      reason: `NEXTAUTH_SECRET es demasiado corta (mínimo ${MIN_SECRET_LENGTH} caracteres).`,
    };
  }
  return { present: true, secure: true, reason: null };
}

/** En producción registra un error claro si el secret es inseguro. */
export function assertNextAuthSecretConfigured(): void {
  const status = getNextAuthSecretStatus();
  const isProd = process.env.NODE_ENV === "production";

  if (status.secure) return;

  const message = `[auth] ${status.reason ?? "NEXTAUTH_SECRET inválida."} Generá una con: openssl rand -hex 32`;

  if (isProd) {
    console.error(message);
    return;
  }
  console.warn(message);
}
