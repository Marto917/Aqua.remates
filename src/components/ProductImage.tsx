"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DEFAULT_PRODUCT_IMAGE,
  ERROR_PRODUCT_IMAGE,
  resolveProductImageUrl,
} from "@/lib/product-images";

type Props = {
  src: string | null | undefined;
  alt: string;
  position?: string | null;
  scale?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

export function ProductImage({
  src,
  alt,
  position = "50% 50%",
  scale = 1,
  className = "object-cover",
  fill = true,
  sizes = "(max-width: 640px) 100vw, 400px",
  priority = false,
}: Props) {
  const resolved = resolveProductImageUrl(src);
  const [imgSrc, setImgSrc] = useState(resolved);

  useEffect(() => {
    setImgSrc(resolved);
  }, [resolved]);

  const objectPosition = position?.trim() || "50% 50%";
  const safeScale = Number.isFinite(scale) && scale > 0 ? Math.min(1.5, Math.max(0.8, scale)) : 1;

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      style={{
        objectPosition,
        transform: safeScale !== 1 ? `scale(${safeScale})` : undefined,
      }}
      sizes={sizes}
      priority={priority}
      unoptimized={imgSrc === DEFAULT_PRODUCT_IMAGE || imgSrc === ERROR_PRODUCT_IMAGE}
      onError={() => {
        setImgSrc((u) => (u === DEFAULT_PRODUCT_IMAGE ? u : DEFAULT_PRODUCT_IMAGE));
      }}
    />
  );
}
