import Image from "next/image";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  size?: number;
  showText?: boolean;
  className?: string;
  logoUrl?: string | null;
};

/** Logo de marca (configurable en admin o public/logo-aqua.png). */
export function SiteLogo({ size = 44, showText = false, className = "", logoUrl }: Props) {
  const src = logoUrl?.trim() ? resolveProductImageUrl(logoUrl) : "/logo-aqua.png";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="relative shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-brand/15"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt="AQUA"
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
          priority
        />
      </span>
      {showText ? (
        <span className="hidden text-lg font-semibold tracking-tight text-brand-dark sm:inline">AQUA</span>
      ) : null}
    </span>
  );
}
