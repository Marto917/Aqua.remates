/** Normaliza código de barras para comparar (trim, sin espacios). */
export function normalizeBarcode(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, "");
}

/** Clave comparable (numéricos: solo dígitos; si no, lowercase). */
export function barcodeMatchKey(value: string | null | undefined): string {
  const raw = normalizeBarcode(value);
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 6) return digits;
  return raw.toLowerCase();
}

export function barcodesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = barcodeMatchKey(a);
  const kb = barcodeMatchKey(b);
  return ka.length > 0 && ka === kb;
}

export type BarcodeInput = {
  code: string;
  label?: string | null;
};

/** Dedup y limpia lista de códigos. */
export function parseBarcodeInputs(raw: BarcodeInput[]): BarcodeInput[] {
  const seen = new Set<string>();
  const out: BarcodeInput[] = [];
  for (const item of raw) {
    const code = normalizeBarcode(item.code).slice(0, 64);
    if (!code) continue;
    const key = barcodeMatchKey(code);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const label = item.label?.trim().slice(0, 40) || null;
    out.push({ code, label });
  }
  return out;
}

/**
 * Lee códigos del form:
 * - sku (principal)
 * - barcode_0, barcode_1… + barcodeLabel_0…
 * - barcodesJson (opcional)
 */
export function barcodesFromFormData(formData: FormData): BarcodeInput[] {
  const collected: BarcodeInput[] = [];

  const fromSku = normalizeBarcode(String(formData.get("sku") ?? ""));
  if (fromSku) collected.push({ code: fromSku });

  for (const [key, value] of formData.entries()) {
    if (!/^barcode_\d+$/.test(key)) continue;
    const idx = key.slice("barcode_".length);
    const code = normalizeBarcode(String(value));
    if (!code) continue;
    const labelRaw = String(formData.get(`barcodeLabel_${idx}`) ?? "").trim();
    collected.push({ code, label: labelRaw || null });
  }

  const jsonRaw = formData.get("barcodesJson");
  if (typeof jsonRaw === "string" && jsonRaw.trim()) {
    try {
      const parsed = JSON.parse(jsonRaw) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "string") collected.push({ code: item });
          else if (item && typeof item === "object" && "code" in item) {
            collected.push({
              code: String((item as { code: unknown }).code ?? ""),
              label:
                typeof (item as { label?: unknown }).label === "string"
                  ? ((item as { label: string }).label as string)
                  : null,
            });
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return parseBarcodeInputs(collected);
}
