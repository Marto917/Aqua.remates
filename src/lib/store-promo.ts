/** Slug URL-safe a partir de un título. */
export function slugifyPromoTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || `promo-${Date.now().toString(36)}`;
}

export function isPromoCurrentlyVisible(promo: {
  published: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}): boolean {
  if (!promo.published) return false;
  const now = Date.now();
  if (promo.startsAt && promo.startsAt.getTime() > now) return false;
  if (promo.endsAt && promo.endsAt.getTime() < now) return false;
  return true;
}
