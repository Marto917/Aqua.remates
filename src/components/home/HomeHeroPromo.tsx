import Image from "next/image";
import Link from "next/link";
import type { HeroPromoSettings } from "@/lib/hero-promo";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  hero: HeroPromoSettings;
};

function FullWidthHeroImage({
  src,
  alt,
  aspectClass,
  className,
}: {
  src: string;
  alt: string;
  aspectClass: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ${aspectClass} ${className ?? ""}`}>
      <Image
        src={resolveProductImageUrl(src)}
        alt={alt}
        fill
        className="object-cover"
        sizes="100vw"
        priority
        unoptimized={src.startsWith("http")}
      />
    </div>
  );
}

/** Banner principal del inicio: imagen a ancho completo, sin texto superpuesto. */
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
      aspectClass="aspect-[21/9] min-h-[12rem] sm:min-h-[14rem] lg:aspect-[3/1] lg:min-h-[16rem]"
      className="hidden sm:block"
    />
  ) : null;

  const mobile = mobileSrc ? (
    <FullWidthHeroImage
      src={mobileSrc}
      alt="Promoción AQUA"
      aspectClass="aspect-[16/9] sm:hidden"
    />
  ) : null;

  const content = (
    <>
      {mobile}
      {desktop ?? (mobileSrc ? (
        <FullWidthHeroImage
          src={mobileSrc}
          alt="Promoción AQUA"
          aspectClass="aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1]"
        />
      ) : null)}
    </>
  );

  if (link) {
    return (
      <Link href={link} className="block w-full">
        {content}
      </Link>
    );
  }

  return <div className="w-full">{content}</div>;
}

/** @deprecated Usar HomeHeroBanner */
export function HomeHeroPromoDesktop({ hero }: Props) {
  return <HomeHeroBanner hero={hero} />;
}

/** @deprecated Usar HomeHeroBanner */
export function HomeHeroPromoMobile({ hero }: Props) {
  return null;
}
