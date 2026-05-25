import Image from "next/image";

type Props = {
  size?: number;
  showText?: boolean;
  className?: string;
};

/** Logo de la tienda (SVG local, siempre disponible). */
export function SiteLogo({ size = 40, showText = true, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="relative shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-brand/20"
        style={{ width: size, height: size }}
      >
        <Image
          src="/aqua_image.svg"
          alt="AQUA"
          width={size}
          height={size}
          className="h-full w-full object-contain p-0.5"
          priority
          unoptimized
        />
      </span>
      {showText ? (
        <span className="hidden text-lg font-semibold tracking-tight text-brand-dark sm:inline">AQUA</span>
      ) : null}
    </span>
  );
}
