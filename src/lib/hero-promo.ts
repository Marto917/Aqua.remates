import { prisma } from "@/lib/prisma";

/** Guía para el panel de vendedor/admin (banner ancho completo en el inicio). */
export const HERO_PROMO_SPECS = {
  desktop: {
    label: "Computadora / tablet",
    where: "Banner ancho completo arriba de todo en la página de inicio (/)",
    minWidth: 1200,
    minHeight: 400,
    aspect: "3:1",
    recommended: "1920 × 640 px (3:1)",
    altRecommended: "1680 × 560 px (21:9)",
    formats: "JPG, PNG o WebP",
  },
  mobile: {
    label: "Celular",
    where: "Mismo banner a ancho completo en el inicio (versión mobile)",
    minWidth: 1080,
    minHeight: 608,
    aspect: "16:9",
    recommended: "1080 × 608 px (16:9)",
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
