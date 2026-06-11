import Image from "next/image";
import Link from "next/link";
import type { HeroPromoSettings } from "@/lib/hero-promo";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  hero: HeroPromoSettings;
};

/** Banner a ancho completo; altura más baja que la proporción original (3:1). */
function FullWidthHeroImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden ${className ?? ""}`}>
      <div className="relative aspect-[4.5/1] w-full sm:aspect-[5/1] md:aspect-[5.5/1]">
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
    <FullWidthHeroImage src={desktopSrc} alt="Promoción AQUA" className="hidden sm:block" />
  ) : null;

  const mobile = mobileSrc ? (
    <FullWidthHeroImage src={mobileSrc} alt="Promoción AQUA" className="sm:hidden" />
  ) : null;

  const content = (
    <>
      {mobile}
      {desktop ?? (mobileSrc ? <FullWidthHeroImage src={mobileSrc} alt="Promoción AQUA" /> : null)}
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
