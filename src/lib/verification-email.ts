import { createHash, randomBytes } from "crypto";
import { buildPublicUrl } from "@/lib/app-url";
import { sendVerificationEmail } from "@/lib/send-verification-email";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 48;

export function createVerificationToken(): {
  plainToken: string;
  tokenHash: string;
  expires: Date;
} {
  const plainToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(plainToken).digest("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  return { plainToken, tokenHash, expires };
}

export function buildVerificationLink(plainToken: string): string {
  return buildPublicUrl("/api/auth/verify-email", { token: plainToken });
}

export async function deliverVerificationEmail(params: {
  to: string;
  name: string;
  plainToken: string;
}): Promise<{ sent: boolean; error?: string; verifyUrl: string }> {
  const verifyUrl = buildVerificationLink(params.plainToken);
  const result = await sendVerificationEmail({
    to: params.to,
    name: params.name,
    verifyUrl,
  });
  return { ...result, verifyUrl };
}
