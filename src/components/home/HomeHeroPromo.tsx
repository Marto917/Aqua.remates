import Image from "next/image";
import Link from "next/link";
import type { HeroPromoSettings } from "@/lib/hero-promo";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  hero: HeroPromoSettings;
};

function PromoImage({
  src,
  alt,
  className,
  aspectClass,
}: {
  src: string;
  alt: string;
  className?: string;
  aspectClass: string;
}) {
  const inner = (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-xl shadow-teal-900/10 ${aspectClass} ${className ?? ""}`}
    >
      <Image
        src={resolveProductImageUrl(src)}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 280px"
        priority
        unoptimized={src.startsWith("http")}
      />
    </div>
  );

  return inner;
}

export function HomeHeroPromoDesktop({ hero }: Props) {
  const { desktopImageUrl, linkUrl } = hero;
  const link = linkUrl?.trim() || null;

  if (desktopImageUrl != null) {
    return (
      <div className="relative mx-auto hidden w-full max-w-[260px] lg:mx-0 lg:block">
        <div className="absolute inset-0 rotate-3 rounded-3xl bg-gradient-to-br from-brand/20 to-teal-100/60" />
        {link ? (
          <Link href={link} className="relative block">
            <PromoImage src={desktopImageUrl} alt="Promoción AQUA" aspectClass="aspect-[4/5]" />
          </Link>
        ) : (
          <div className="relative">
            <PromoImage src={desktopImageUrl} alt="Promoción AQUA" aspectClass="aspect-[4/5]" />
          </div>
        )}
      </div>
    );
  }

  return (
      <div className="relative mx-auto hidden w-full max-w-[260px] lg:mx-0 lg:block" aria-hidden>
        <div className="absolute inset-0 rotate-3 rounded-3xl bg-gradient-to-br from-brand/20 to-teal-100/60" />
        <div className="relative flex aspect-[4/5] flex-col justify-between rounded-3xl border border-white/60 bg-white/90 p-5 shadow-xl shadow-teal-900/10 backdrop-blur">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Comprá fácil</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">Carrito y checkout claros</p>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-3/4 rounded-full bg-brand/30" />
            <div className="h-2.5 w-full rounded-full bg-slate-100" />
            <div className="h-2.5 w-5/6 rounded-full bg-slate-100" />
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-3 text-center text-sm font-semibold text-white">
            AQUA — calidad y variedad
          </div>
        </div>
      </div>
  );
}

export function HomeHeroPromoMobile({ hero }: Props) {
  const { mobileImageUrl, linkUrl } = hero;
  if (!mobileImageUrl) return null;

  const link = linkUrl?.trim() || null;
  const image = (
    <PromoImage
      src={mobileImageUrl}
      alt="Promoción AQUA"
      aspectClass="aspect-[16/9] w-full"
    />
  );

  return (
    <div className="mt-6 lg:hidden">
      {link ? <Link href={link}>{image}</Link> : image}
    </div>
  );
}
