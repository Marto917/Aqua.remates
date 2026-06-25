const ENVIALOSIMPLE_API_URL = "https://api.envialosimple.email/api/v1/mail/send";

export function isEnvialoSimpleConfigured(): boolean {
  return Boolean(process.env.ENVIALOSIMPLE_API_KEY?.trim());
}

export function getDefaultFromEmail(): string {
  return process.env.EMAIL_FROM?.trim() || "AQUA <ventas@aquaremates.com.ar>";
}

type SendViaEnvialoSimpleParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

export async function sendViaEnvialoSimple(
  params: SendViaEnvialoSimpleParams,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.ENVIALOSIMPLE_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "ENVIALOSIMPLE_API_KEY no configurada" };
  }

  const body: Record<string, string> = {
    from: params.from ?? getDefaultFromEmail(),
    to: params.to,
    subject: params.subject,
    html: params.html,
  };
  if (params.text) {
    body.text = params.text;
  }

  try {
    const res = await fetch(ENVIALOSIMPLE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const responseBody = await res.text().catch(() => "");
      console.error("EnvialoSimple error:", res.status, responseBody);
      return { sent: false, reason: "Error al enviar el correo" };
    }

    return { sent: true };
  } catch (e) {
    console.error("EnvialoSimple fetch error:", e);
    return { sent: false, reason: "No se pudo conectar con EnvialoSimple" };
  }
}
