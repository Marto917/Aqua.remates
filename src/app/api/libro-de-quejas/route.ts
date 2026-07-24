import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, hashIp } from "@/lib/client-ip";
import { buildBrandedEmailHtml, escapeHtml } from "@/lib/email-layout";
import { checkRateLimit, RATE_LIMITS, recordRateLimitAttempt } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/send-email";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  message: z.string().trim().min(10).max(4000),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const clientIp = getClientIp(req);
  const limit = RATE_LIMITS.checkoutIp(hashIp(clientIp));
  const check = await checkRateLimit(limit);
  if (!check.allowed) {
    return NextResponse.json({ error: check.message }, { status: 429 });
  }

  const formData = await req.formData();
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
    turnstileToken: String(formData.get("turnstileToken") ?? "") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá los datos del formulario." }, { status: 400 });
  }

  const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return NextResponse.json({ error: "Verificación anti-bots fallida." }, { status: 400 });
  }

  const to =
    process.env.COMPLAINTS_TO_EMAIL?.trim() ||
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.ORDER_NOTIFY_EMAIL?.trim();

  if (!to) {
    console.warn("[libro-de-quejas] Sin COMPLAINTS_TO_EMAIL; se loguea en consola.");
    console.info("[libro-de-quejas]", parsed.data);
  } else {
    const bodyHtml = `
      <p><strong>Nombre:</strong> ${escapeHtml(parsed.data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(parsed.data.phone)}</p>
      <h2 style="font-size:1rem;margin-top:1.25rem">Consulta</h2>
      <p style="white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>
    `;
    const html = await buildBrandedEmailHtml({
      title: "Libro de quejas",
      bodyHtml,
      preheader: `Consulta de ${parsed.data.name}`,
    });
    try {
      await sendEmail({
        to,
        subject: `AQUA — Libro de quejas: ${parsed.data.name}`,
        html,
        text: [
          `Nombre: ${parsed.data.name}`,
          `Email: ${parsed.data.email}`,
          `Tel: ${parsed.data.phone}`,
          "",
          parsed.data.message,
        ].join("\n"),
      });
    } catch (e) {
      console.error("[libro-de-quejas] email:", e);
      return NextResponse.json({ error: "No se pudo enviar el mail. Intentá más tarde." }, { status: 500 });
    }
  }

  await recordRateLimitAttempt(limit);
  return NextResponse.json({ ok: true });
}
