/**
 * Color aproximado para mostrar un círculo según el nombre del color (español).
 * Si no coincide, genera un tono estable a partir del texto.
 */
const MAP: Record<string, string> = {
  azul: "#2563eb",
  rosa: "#ec4899",
  negro: "#171717",
  blanco: "#f1f5f9",
  gris: "#64748b",
  beige: "#d4c4a8",
  terracota: "#b45309",
  cromo: "#9ca3af",
  verde: "#16a34a",
  rojo: "#dc2626",
  amarillo: "#eab308",
  naranja: "#ea580c",
  violeta: "#7c3aed",
  marron: "#78350f",
  marrón: "#78350f",
  celeste: "#38bdf8",
  dorado: "#ca8a04",
  plateado: "#cbd5e1",
  unico: "#64748b",
  único: "#64748b",
};

function simpleHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function swatchColorForLabel(label: string): string {
  const key = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (MAP[key]) return MAP[key];
  const h = simpleHue(key);
  return `hsl(${h} 42% 46%)`;
}
