"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveProductImageUrl } from "@/lib/product-images";

type Slide = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  gradient?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
};

const defaultSlides: Slide[] = [
  {
    id: "default-1",
    title: "Envíos a todo el país",
    subtitle: "Coordinamos entrega según tu zona.",
    gradient: "from-teal-600 via-teal-500 to-cyan-500",
  },
  {
    id: "default-2",
    title: "Pagá con transferencia",
    subtitle: "Precio claro al finalizar tu pedido minorista.",
    gradient: "from-cyan-600 via-teal-600 to-emerald-600",
  },
  {
    id: "default-3",
    title: "Nuevos ingresos toda la semana",
    subtitle: "Sumamos productos y ofertas para tu compra diaria.",
    gradient: "from-emerald-700 via-teal-600 to-teal-700",
  },
];

function isRemoteSrc(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function PromoCarousel({ slides = defaultSlides }: { slides?: Slide[] }) {
  const [index, setIndex] = useState(0);
  const safeSlides = slides.length > 0 ? slides : defaultSlides;
  const s = safeSlides[index];
  const imageSrc = s.imageUrl?.trim() ? resolveProductImageUrl(s.imageUrl) : null;
  const hasImage = Boolean(imageSrc);
  const showTitle =
    Boolean(s.title?.trim()) &&
    s.title!.trim().toLowerCase() !== "promoción" &&
    s.title!.trim().toLowerCase() !== "promocion";

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  const dots = (
    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2 px-4">
      {safeSlides.map((slide, i) => (
        <button
          key={slide.id || i}
          type="button"
          aria-label={`Slide ${i + 1}`}
          className={`h-2 rounded-full transition-all ${
            i === index ? "w-8 bg-white shadow" : "w-2 bg-white/50"
          }`}
          onClick={() => setIndex(i)}
        />
      ))}
    </div>
  );

  const content = hasImage ? (
    <div className="relative aspect-[16/6] w-full sm:aspect-[21/7]">
      <Image
        src={imageSrc!}
        alt={showTitle ? s.title! : "Promoción AQUA"}
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority={index === 0}
        unoptimized={isRemoteSrc(imageSrc!)}
      />
      {showTitle || s.subtitle ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-10 pt-16 text-center text-white">
          {showTitle ? (
            <h2 className="text-lg font-bold leading-tight sm:text-2xl">{s.title}</h2>
          ) : null}
          {s.subtitle ? <p className="mt-1 text-sm text-white/90 sm:text-base">{s.subtitle}</p> : null}
        </div>
      ) : null}
      {dots}
    </div>
  ) : (
    <div
      className={`relative overflow-hidden bg-gradient-to-br px-6 py-10 text-center text-white sm:py-14 ${
        s.gradient ?? "from-teal-600 via-teal-500 to-cyan-500"
      }`}
    >
      <div className="relative mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
          {s.title || "Nueva promoción"}
        </h2>
        {s.subtitle ? <p className="mt-2 text-base text-white/90">{s.subtitle}</p> : null}
      </div>
      {dots}
    </div>
  );

  if (s.linkUrl?.trim()) {
    return (
      <section className="overflow-hidden rounded-2xl shadow-md">
        <Link href={s.linkUrl.trim()} className="block">
          {content}
        </Link>
      </section>
    );
  }

  return <section className="overflow-hidden rounded-2xl shadow-md">{content}</section>;
}
