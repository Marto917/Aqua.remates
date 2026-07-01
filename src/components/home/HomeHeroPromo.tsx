import Image from "next/image";
import Link from "next/link";
import type { HeroPromoSettings } from "@/lib/hero-promo";
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
  const aspectClass = variant === "mobile" ? "aspect-[2/1]" : "aspect-[3/1]";

  return (
    <div className={`relative w-full overflow-hidden ${className ?? ""}`}>
      <div className={`relative w-full ${aspectClass}`}>
        <Image
          src={resolveProductImageUrl(src)}
          alt={alt}
          fill
          className="object-cover object-center"
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
      {desktop ?? (mobileSrc ? <FullWidthHeroImage src={mobileSrc} alt="Promoción AQUA" variant="desktop" /> : null)}
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
    <div className="-mt-5 w-full sm:-mt-8">
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">{inner}</div>
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
