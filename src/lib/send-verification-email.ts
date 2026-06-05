type SendVerificationEmailParams = {
  to: string;
  name: string;
  verifyUrl: string;
};

const FROM_EMAIL = process.env.EMAIL_FROM?.trim() || "Aqua Remates <onboarding@resend.dev>";

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: SendVerificationEmailParams): Promise<{ sent: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return { sent: false, error: "RESEND_API_KEY no configurada." };
  }

  const subject = "Confirmá tu email — Aqua Remates";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#0f766e;font-size:20px">Hola ${escapeHtml(name)}</h1>
      <p style="color:#334155;line-height:1.5">
        Gracias por registrarte en Aqua Remates. Tocá el botón para confirmar que este email es tuyo:
      </p>
      <p style="margin:28px 0">
        <a href="${verifyUrl}" style="background:#14b8a6;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">
          Verificar mi email
        </a>
      </p>
      <p style="color:#64748b;font-size:13px;line-height:1.5">
        Si no creaste esta cuenta, ignorá este mensaje. El enlace vence en 48 horas.
      </p>
      <p style="color:#94a3b8;font-size:11px;word-break:break-all">${verifyUrl}</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Resend error:", res.status, body);
    return { sent: false, error: "No se pudo enviar el email de verificación." };
  }

  return { sent: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
