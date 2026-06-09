import Image from "next/image";
import Link from "next/link";
import type { HeroPromoSettings } from "@/lib/hero-promo";
import { HERO_PROMO_SPECS } from "@/lib/hero-promo";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  hero: HeroPromoSettings;
};

/** Muestra la imagen a ancho del contenedor, sin recortar ni agrandar (respeta proporción original). */
function FullWidthHeroImage({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <Image
      src={resolveProductImageUrl(src)}
      alt={alt}
      width={width}
      height={height}
      className={`block h-auto w-full ${className ?? ""}`}
      sizes="100vw"
      priority
      unoptimized={src.startsWith("http")}
    />
  );
}

/** Banner principal del inicio: imagen a ancho completo, sin recorte. */
export function HomeHeroBanner({ hero }: Props) {
  const { desktopImageUrl, mobileImageUrl, linkUrl } = hero;
  const link = linkUrl?.trim() || null;
  const desktopSrc = desktopImageUrl ?? mobileImageUrl;
  const mobileSrc = mobileImageUrl ?? desktopImageUrl;

  if (!desktopSrc && !mobileSrc) {
    return null;
  }

  const desktopW = HERO_PROMO_SPECS.desktop.minWidth;
  const desktopH = Math.round(desktopW / 3);
  const mobileW = HERO_PROMO_SPECS.mobile.minWidth;
  const mobileH = HERO_PROMO_SPECS.mobile.minHeight;

  const desktop = desktopSrc ? (
    <FullWidthHeroImage
      src={desktopSrc}
      alt="Promoción AQUA"
      width={desktopW}
      height={desktopH}
      className="hidden sm:block"
    />
  ) : null;

  const mobile = mobileSrc ? (
    <FullWidthHeroImage
      src={mobileSrc}
      alt="Promoción AQUA"
      width={mobileSrc === desktopSrc && !mobileImageUrl ? desktopW : mobileW}
      height={mobileSrc === desktopSrc && !mobileImageUrl ? desktopH : mobileH}
      className="sm:hidden"
    />
  ) : null;

  const content = (
    <>
      {mobile}
      {desktop ?? (mobileSrc ? (
        <FullWidthHeroImage
          src={mobileSrc}
          alt="Promoción AQUA"
          width={mobileW}
          height={mobileH}
        />
      ) : null)}
    </>
  );

  const inner = link ? (
    <Link href={link} className="block w-full">
      {content}
    </Link>
  ) : (
    <div className="w-full">{content}</div>
  );

  /** Sale del max-w-6xl del layout y ocupa todo el ancho de la pantalla. */
  return (
    <div className="-mt-5 w-screen max-w-[100vw] ml-[calc(50%-50vw)] sm:-mt-8">
      {inner}
    </div>
  );
}

/** @deprecated Usar HomeHeroBanner */
export function HomeHeroPromoDesktop({ hero }: Props) {
  return <HomeHeroBanner hero={hero} />;
}

/** @deprecated Usar HomeHeroBanner */
export function HomeHeroPromoMobile({ hero }: Props) {
  return null;
}
