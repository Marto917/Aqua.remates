const DEFAULT_PRIMARY = "#14b8a8";
const DEFAULT_DARK = "#0f766e";
const DEFAULT_MUTED = "#f0fdfa";

type Props = {
  primary?: string | null;
  dark?: string | null;
  muted?: string | null;
};

function normalizeHex(value: string | null | undefined, fallback: string): string {
  const v = value?.trim();
  if (!v) return fallback;
  return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : fallback;
}

export function StoreThemeStyles({ primary, dark, muted }: Props) {
  const p = normalizeHex(primary, DEFAULT_PRIMARY);
  const d = normalizeHex(dark, DEFAULT_DARK);
  const m = normalizeHex(muted, DEFAULT_MUTED);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{--color-brand:${p};--color-brand-dark:${d};--color-brand-muted:${m};--color-brand-light:${m};}`,
      }}
    />
  );
}
