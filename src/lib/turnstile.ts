const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
}

export function getTurnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || null;
}

type SiteVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

/** Verifica token de Cloudflare Turnstile. Si no está configurado, permite (dev/local). */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[turnstile] TURNSTILE_SECRET_KEY no configurada en producción.");
    }
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "Completá la verificación anti-bots." };
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as SiteVerifyResponse;
    if (data.success) return { ok: true };
    console.warn("[turnstile] Verificación fallida:", data["error-codes"]);
    return { ok: false, error: "No pudimos verificar que sos una persona. Intentá de nuevo." };
  } catch (e) {
    console.error("[turnstile] Error de red:", e);
    return { ok: false, error: "Error al verificar anti-bots. Intentá de nuevo." };
  }
}
