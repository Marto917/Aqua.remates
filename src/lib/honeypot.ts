/** Campo oculto que los bots suelen completar. Si tiene valor, rechazar silenciosamente. */
export function isHoneypotTriggered(value: unknown): boolean {
  if (value == null) return false;
  const str = String(value).trim();
  return str.length > 0;
}

export const HONEYPOT_FIELD_NAME = "website";
