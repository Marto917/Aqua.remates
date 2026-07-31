/** Proporción y tamaño recomendado del carrusel del home (admin + tienda). */
export const CAROUSEL_BANNER_SPECS = {
  /** Tailwind: aspect-[16/5] = 1920×600 */
  aspectClass: "aspect-[16/5]",
  aspectLabel: "16:5",
  recommended: "1920 × 600 px (16:5)",
  note: "Se muestra completa, sin recortar. Si la proporción no coincide, puede quedar un borde suave.",
  maxSidePx: 1920,
} as const;

/** Banner principal (hero) del inicio. */
export const HERO_BANNER_ASPECT = {
  desktop: { aspectClass: "aspect-[3/1]", label: "3:1" },
  mobile: { aspectClass: "aspect-[2/1]", label: "2:1" },
} as const;
