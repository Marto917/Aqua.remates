const MIN_ACCOUNT_DAYS = 7;

export function accountAgeDays(createdAt: Date, now = new Date()): number {
  const ms = now.getTime() - createdAt.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function canCustomerReview(createdAt: Date, now = new Date()): boolean {
  return accountAgeDays(createdAt, now) >= MIN_ACCOUNT_DAYS;
}

export function reviewEligibilityMessage(createdAt: Date, now = new Date()): string {
  const days = accountAgeDays(createdAt, now);
  const left = MIN_ACCOUNT_DAYS - days;
  if (left <= 0) {
    return "";
  }
  return `Podés dejar opiniones cuando tu cuenta tenga al menos ${MIN_ACCOUNT_DAYS} días (${left} día${left === 1 ? "" : "s"} restante${left === 1 ? "" : "s"}).`;
}
