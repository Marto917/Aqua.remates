import { COLOR_OPTIONS } from "@/lib/color-options";

export function colorLabelToDisplayName(label: string | null | undefined): string {
  if (!label?.trim()) return "—";
  const trimmed = label.trim();
  const byHex = COLOR_OPTIONS.find((c) => c.hex.toUpperCase() === trimmed.toUpperCase());
  if (byHex) return byHex.label;
  if (trimmed.startsWith("#")) return trimmed;
  return trimmed;
}

export function formatVariantColorsForStaff(labels: string[]): string {
  if (labels.length === 0) return "—";
  return labels.map((l) => colorLabelToDisplayName(l)).join(", ");
}
