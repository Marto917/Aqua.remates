import { getDefaultFromEmail, sendViaEnvialoSimple } from "@/lib/envialosimple";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.ENVIALOSIMPLE_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email]", params.subject, "→", params.to);
      console.info(params.text ?? params.html);
    }
    return { sent: false, reason: "ENVIALOSIMPLE_API_KEY no configurada" };
  }

  return sendViaEnvialoSimple({
    from: getDefaultFromEmail(),
    ...params,
  });
}
