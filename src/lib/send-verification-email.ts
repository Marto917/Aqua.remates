import { buildBrandedEmailHtml, emailButton, escapeHtml } from "@/lib/email-layout";
import { sendEmail } from "@/lib/send-email";

type SendVerificationEmailParams = {
  to: string;
  name: string;
  verifyUrl: string;
};

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: SendVerificationEmailParams): Promise<{ sent: boolean; error?: string }> {
  const subject = "Confirmá tu email — Aqua Remates";
  const bodyHtml = `
    <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
    <p>Gracias por registrarte en Aqua Remates. Tocá el botón para confirmar que este email es tuyo:</p>
    ${emailButton("Verificar mi email", verifyUrl)}
    <p style="color:#64748b;font-size:13px;line-height:1.5">
      Si no creaste esta cuenta, ignorá este mensaje. El enlace vence en 48 horas.
    </p>
    <p style="color:#94a3b8;font-size:11px;word-break:break-all">${escapeHtml(verifyUrl)}</p>
  `;

  const html = await buildBrandedEmailHtml({
    title: "Confirmá tu email",
    bodyHtml,
    preheader: "Activá tu cuenta en Aqua Remates",
  });

  const result = await sendEmail({ to, subject, html });
  if (!result.sent) {
    return { sent: false, error: result.reason ?? "No se pudo enviar el email de verificación." };
  }

  return { sent: true };
}
