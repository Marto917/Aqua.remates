/** URL pública de la app (Railway / Vercel / local). */
export function getAppBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/**
 * Usa el dominio real del request (ej. aquaremates-copy-production) para OAuth,
 * sin depender de que NEXTAUTH_URL en Railway coincida con la URL pública.
 */
export function syncNextAuthUrlFromRequest(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = (forwardedHost ?? req.headers.get("host"))?.split(",")[0]?.trim();
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto ?? (new URL(req.url).protocol.replace(":", "") || "https");

  if (host) {
    const base = `${proto}://${host}`.replace(/\/$/, "");
    process.env.NEXTAUTH_URL = base;
    return base;
  }

  const origin = new URL(req.url).origin.replace(/\/$/, "");
  process.env.NEXTAUTH_URL = origin;
  return origin;
}
