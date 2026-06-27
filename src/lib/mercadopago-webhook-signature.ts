import { createHmac, timingSafeEqual } from "crypto";

/** Valida firma x-signature de Mercado Pago cuando MERCADOPAGO_WEBHOOK_SECRET está configurado. */
export function verifyMercadoPagoWebhookSignature(
  req: Request,
  dataId: string,
): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return { ok: true };
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) {
    return { ok: false, reason: "Faltan headers de firma." };
  }

  let ts: string | undefined;
  let receivedHash: string | undefined;
  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=");
    if (key === "ts") ts = value;
    if (key === "v1") receivedHash = value;
  }
  if (!ts || !receivedHash) {
    return { ok: false, reason: "Formato de firma inválido." };
  }

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    return { ok: false, reason: "Timestamp inválido." };
  }
  const ageSeconds = Math.abs(Date.now() / 1000 - tsNum);
  if (ageSeconds > 300) {
    return { ok: false, reason: "Firma expirada." };
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(receivedHash, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "Firma incorrecta." };
    }
  } catch {
    return { ok: false, reason: "Firma incorrecta." };
  }

  return { ok: true };
}
