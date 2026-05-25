type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "AQUA <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email]", params.subject, "→", params.to);
      console.info(params.text ?? params.html);
    }
    return { sent: false, reason: "RESEND_API_KEY no configurada" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend error:", res.status, body);
      return { sent: false, reason: "Error al enviar el correo" };
    }

    return { sent: true };
  } catch (e) {
    console.error("Resend fetch error:", e);
    return { sent: false, reason: "No se pudo conectar con el servicio de email" };
  }
}
