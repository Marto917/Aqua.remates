import {
  checkRateLimit,
  clearRateLimitBucket,
  RATE_LIMITS,
  recordRateLimitAttempt,
} from "@/lib/rate-limit";

export async function checkLoginRateLimit(
  email: string,
): Promise<{ allowed: boolean; message?: string }> {
  const config = RATE_LIMITS.loginEmail(email);
  const result = await checkRateLimit(config);
  if (!result.allowed) {
    return { allowed: false, message: result.message };
  }
  return { allowed: true };
}

export async function recordLoginFailure(email: string): Promise<void> {
  await recordRateLimitAttempt(RATE_LIMITS.loginEmail(email));
}

export async function clearLoginRateLimit(email: string): Promise<void> {
  await clearRateLimitBucket(RATE_LIMITS.loginEmail(email).bucketKey);
}
