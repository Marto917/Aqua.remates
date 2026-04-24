/**
 * Texto mostrado al cliente: cada palabra con mayúscula inicial y el resto en minúsculas
 * (es), sin importar cómo lo cargue el vendedor.
 * Códigos hex de color (#RRGGBB) se normalizan a mayúsculas; se conservan los saltos de línea.
 */
function formatToken(word: string): string {
  if (!word) return word;
  if (/^#[0-9A-Fa-f]{6}$/i.test(word)) {
    return word.toUpperCase();
  }
  if (/^#/.test(word) && word.length > 1) {
    const first = word.charAt(0);
    const rest = word.slice(1);
    if (/^[0-9A-Fa-f]+$/i.test(rest)) {
      return `${first}${rest.toUpperCase()}`;
    }
  }
  return word.charAt(0).toLocaleUpperCase("es-AR") + word.slice(1).toLocaleLowerCase("es-AR");
}

export function formatDisplayWords(input: string | null | undefined): string {
  if (input == null) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";
  return trimmed
    .split("\n")
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(formatToken)
        .join(" "),
    )
    .join("\n");
}
