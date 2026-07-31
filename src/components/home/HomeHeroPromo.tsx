import Image from "next/image";
import Link from "next/link";
import type { HeroPromoSettings } from "@/lib/hero-promo";
import { HERO_BANNER_ASPECT } from "@/lib/banner-image-specs";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  hero: HeroPromoSettings;
};

/** Banner a ancho completo; proporción 2:1 mobile, 3:1 desktop (alineado con admin). */
function FullWidthHeroImage({
  src,
  alt,
  variant,
  className,
}: {
  src: string;
  alt: string;
  variant: "mobile" | "desktop";
  className?: string;
}) {
  const aspectClass =
    variant === "mobile" ? HERO_BANNER_ASPECT.mobile.aspectClass : HERO_BANNER_ASPECT.desktop.aspectClass;

  return (
    <div className={`relative w-full overflow-hidden bg-slate-100 ${className ?? ""}`}>
      <div className={`relative w-full ${aspectClass}`}>
        <Image
          src={resolveProductImageUrl(src)}
          alt={alt}
          fill
          className="object-contain object-center"
          sizes="100vw"
          priority
          unoptimized={src.startsWith("http")}
        />
      </div>
    </div>
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

  const desktop = desktopSrc ? (
    <FullWidthHeroImage
      src={desktopSrc}
      alt="Promoción AQUA"
      variant="desktop"
      className="hidden sm:block"
    />
  ) : null;

  const mobile = mobileSrc ? (
    <FullWidthHeroImage
      src={mobileSrc}
      alt="Promoción AQUA"
      variant="mobile"
      className="sm:hidden"
    />
  ) : null;

  const content = (
    <>
      {mobile}
      {desktop ??
        (mobileSrc ? (
          <FullWidthHeroImage src={mobileSrc} alt="Promoción AQUA" variant="desktop" className="hidden sm:block" />
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

  /** Sale del max-w-6xl del layout y ocupa todo el ancho (sin w-screen/transform que tapa el nav). */
  return (
    <div className="-mt-5 w-full sm:-mt-8">
      <div className="relative ml-[calc(50%-50vw)] w-[100vw] max-w-[100vw]">{inner}</div>
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
