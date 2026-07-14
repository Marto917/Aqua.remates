const APEX_TO_WWW = ["aquaremates.com.ar"] as const;
const CANONICAL_PUBLIC_HOST = "www.aquaremates.com.ar";

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

function isAquaRematesHost(hostOrUrl: string): boolean {
  const v = hostOrUrl.toLowerCase();
  return v.includes("aquaremates.com.ar");
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
  const normalized = preferWwwForKnownApex(normalizeBaseUrl(raw));
  // Si alguien dejó el host de Railway en NEXTAUTH_URL pero el sitio vive en el dominio propio,
  // los mails/OAuth deben usar www igualmente cuando PUBLIC_APP_URL lo indica.
  if (isAquaRematesHost(normalized)) {
    return `https://${CANONICAL_PUBLIC_HOST}`;
  }
  if (
    isAquaRematesHost(process.env.PUBLIC_APP_URL ?? "") ||
    process.env.FORCE_PUBLIC_WWW === "true"
  ) {
    return `https://${CANONICAL_PUBLIC_HOST}`;
  }
  return normalized;
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
 * Fija NEXTAUTH_URL para el request OAuth.
 * En aquaremates SIEMPRE usa www (nunca el host *.up.railway.app),
 * así Google recibe siempre la misma redirect_uri.
 */
export function syncNextAuthUrlFromRequest(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = (forwardedHost ?? req.headers.get("host"))?.split(",")[0]?.trim() ?? "";
  const publicConfigured =
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";

  // Dominio propio o PUBLIC_APP_URL del sitio: OAuth fijo a www.
  if (isAquaRematesHost(host) || isAquaRematesHost(publicConfigured)) {
    const base = `https://${CANONICAL_PUBLIC_HOST}`;
    process.env.NEXTAUTH_URL = base;
    return base;
  }

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
