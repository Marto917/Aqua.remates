const APEX_TO_WWW = ["aquaremates.com.ar"] as const;
const CANONICAL_PUBLIC_HOST = "www.aquaremates.com.ar";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function envUrl(name: "PUBLIC_APP_URL" | "NEXTAUTH_URL" | "NEXT_PUBLIC_APP_URL"): string {
  return process.env[name]?.trim() ?? "";
}

/**
 * Convierte el apex a www en producción para enlaces públicos (emails, OAuth, verificación).
 * El apex puede fallar en algunas redes por caché DNS; www suele resolver bien.
 */
function preferWwwForKnownApex(base: string): string {
  if (!base || base.includes("localhost") || base.includes("127.0.0.1")) return base;
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

function isInternalHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0] ?? "";
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h.endsWith(".railway.internal")
  );
}

/**
 * URL pública canónica para emails, verificación y redirecciones externas.
 * Prioridad: PUBLIC_APP_URL → NEXTAUTH_URL → NEXT_PUBLIC_APP_URL.
 * (Strings vacíos no cuentan — en Railway a veces la variable existe pero vacía.)
 */
export function getPublicAppUrl(): string {
  const raw =
    envUrl("PUBLIC_APP_URL") ||
    envUrl("NEXTAUTH_URL") ||
    envUrl("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3000";
  const normalized = preferWwwForKnownApex(normalizeBaseUrl(raw));
  if (!normalized) {
    return `https://${CANONICAL_PUBLIC_HOST}`;
  }
  // Si alguien dejó el host de Railway en NEXTAUTH_URL pero el sitio vive en el dominio propio,
  // los mails/OAuth deben usar www igualmente cuando PUBLIC_APP_URL lo indica.
  if (isAquaRematesHost(normalized)) {
    return `https://${CANONICAL_PUBLIC_HOST}`;
  }
  if (isAquaRematesHost(envUrl("PUBLIC_APP_URL")) || process.env.FORCE_PUBLIC_WWW === "true") {
    return `https://${CANONICAL_PUBLIC_HOST}`;
  }
  return normalized;
}

/** Alias usado en emails y assets públicos. */
export function getAppBaseUrl(): string {
  return getPublicAppUrl();
}

/**
 * Origen seguro para redirects HTTP (forms POST → 303).
 * Prioriza x-forwarded-host (dominio real del usuario) y nunca localhost del contenedor.
 */
export function resolveAppOrigin(req?: Request): string {
  if (req) {
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? "";
    const hostHeader = req.headers.get("host")?.split(",")[0]?.trim() ?? "";
    const host = forwardedHost || hostHeader;
    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto =
      forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");

    if (host && !isInternalHost(host)) {
      return preferWwwForKnownApex(`${proto}://${host}`.replace(/\/$/, ""));
    }
  }

  try {
    const configured = getPublicAppUrl();
    if (configured && !isInternalHost(new URL(configured).hostname)) {
      return configured;
    }
  } catch {
    /* fallback abajo */
  }

  return `https://${CANONICAL_PUBLIC_HOST}`;
}

/** URL absoluta de una ruta de la app (para Location de redirects). */
export function appPathUrl(path: string, req?: Request): URL {
  const raw = path.startsWith("/") ? path : `/${path}`;
  try {
    return new URL(raw, `${resolveAppOrigin(req)}/`);
  } catch {
    return new URL(raw, `https://${CANONICAL_PUBLIC_HOST}/`);
  }
}

/** Redirect 303 (POST → GET) a una ruta de la app, sin usar el host interno de Railway. */
export function redirectToApp(path: string, req?: Request): Response {
  return Response.redirect(appPathUrl(path, req), 303);
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
    envUrl("PUBLIC_APP_URL") || envUrl("NEXTAUTH_URL") || envUrl("NEXT_PUBLIC_APP_URL");

  // Dominio propio o PUBLIC_APP_URL del sitio: OAuth fijo a www.
  if (isAquaRematesHost(host) || isAquaRematesHost(publicConfigured)) {
    const base = `https://${CANONICAL_PUBLIC_HOST}`;
    process.env.NEXTAUTH_URL = base;
    return base;
  }

  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto ?? (new URL(req.url).protocol.replace(":", "") || "https");

  if (host && !isInternalHost(host)) {
    const base = preferWwwForKnownApex(`${proto}://${host}`.replace(/\/$/, ""));
    process.env.NEXTAUTH_URL = base;
    return base;
  }

  const base = getPublicAppUrl();
  process.env.NEXTAUTH_URL = base;
  return base;
}
