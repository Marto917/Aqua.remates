import { prisma } from "@/lib/prisma";

/** Guía para el panel de vendedor/admin. */
export const HERO_PROMO_SPECS = {
  desktop: {
    label: "Computadora / tablet horizontal",
    where: "Columna derecha del recuadro principal en la página de inicio (/)",
    minWidth: 520,
    minHeight: 650,
    aspect: "4:5",
    recommended: "1040 × 1300 px (Retina)",
    formats: "JPG, PNG o WebP",
  },
  mobile: {
    label: "Celular",
    where: "Debajo del buscador, dentro del mismo recuadro del inicio (/)",
    minWidth: 1080,
    minHeight: 600,
    aspect: "16:9",
    recommended: "1080 × 600 px o más",
    formats: "JPG, PNG o WebP",
  },
} as const;

export type HeroPromoSettings = {
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  linkUrl: string | null;
};

export async function getHeroPromoSettings(): Promise<HeroPromoSettings> {
  try {
    const row = await prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: {
        heroPromoDesktopImageUrl: true,
        heroPromoMobileImageUrl: true,
        heroPromoLinkUrl: true,
      },
    });
    return {
      desktopImageUrl: row?.heroPromoDesktopImageUrl ?? null,
      mobileImageUrl: row?.heroPromoMobileImageUrl ?? null,
      linkUrl: row?.heroPromoLinkUrl ?? null,
    };
  } catch {
    return { desktopImageUrl: null, mobileImageUrl: null, linkUrl: null };
  }
}
