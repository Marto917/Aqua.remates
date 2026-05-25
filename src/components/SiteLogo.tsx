import Image from "next/image";

type Props = {
  size?: number;
  showText?: boolean;
  className?: string;
};

/** Logo AQUA: imagen completa (no recortada en círculo). */
export function SiteLogo({ size = 44, showText = true, className = "" }: Props) {
  const imgHeight = size;
  const imgWidth = Math.round(size * 2.4);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/aqua_image.webp"
        alt="AQUA"
        width={imgWidth}
        height={imgHeight}
        className="h-auto w-auto max-h-11 object-contain"
        style={{ maxHeight: size, width: "auto" }}
        priority
        unoptimized
      />
      {showText ? (
        <span className="text-lg font-bold tracking-tight text-brand-dark">AQUA</span>
      ) : null}
    </span>
  );
}
