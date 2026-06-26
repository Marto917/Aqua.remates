const APEX_TO_WWW = ["aquaremates.com.ar"] as const;

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/**
 * Convierte el apex a www en producción para enlaces públicos (emails, OAuth, verificación).
 * El apex puede fallar en algunas redes por caché DNS; www suele resolver bien.
 */
function preferWwwForKnownApex(base: string): string {
  if (base.includes("localhost") || base.includes("127.0.0.1")) return base;
  try {
    const u = new URL(base.startsWith("http") ? base : `https://${base}`);
    if (!u.hostname.startsWith("www.") && (APEX_TO_WWW as readonly string[]).includes(u.hostname)) {
      u.hostname = `www.${u.hostname}`;
    }
    return u.origin.replace(/\/$/, "");
  } catch {
    return base;
  }
}

/**
 * URL pública canónica para emails, verificación y redirecciones externas.
 * Prioridad: PUBLIC_APP_URL → NEXTAUTH_URL → NEXT_PUBLIC_APP_URL.
 */
export function getPublicAppUrl(): string {
  const raw =
    process.env.PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return preferWwwForKnownApex(normalizeBaseUrl(raw));
}

/** Alias usado en emails y assets públicos. */
export function getAppBaseUrl(): string {
  return getPublicAppUrl();
}

export function buildPublicUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, getPublicAppUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
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
    const base = preferWwwForKnownApex(`${proto}://${host}`.replace(/\/$/, ""));
    process.env.NEXTAUTH_URL = base;
    return base;
  }

  const origin = preferWwwForKnownApex(new URL(req.url).origin.replace(/\/$/, ""));
  process.env.NEXTAUTH_URL = origin;
  return origin;
}
