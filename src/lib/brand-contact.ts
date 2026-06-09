export function normalizeSocialUrl(raw: string | null | undefined, platform: "instagram" | "tiktok"): string | null {
  if (!raw?.trim()) return null;
  let value = raw.trim();
  if (value.startsWith("@")) {
    const handle = value.slice(1).replace(/^\/+/, "");
    if (!handle) return null;
    return platform === "instagram"
      ? `https://www.instagram.com/${handle}/`
      : `https://www.tiktok.com/@${handle}`;
  }
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value;
}

export function formatWhatsAppHref(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const withCountry = digits.startsWith("54") ? digits : `54${digits}`;
  return `https://wa.me/${withCountry}`;
}
