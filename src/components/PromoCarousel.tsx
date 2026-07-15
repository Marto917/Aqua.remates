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

const FADE_MS = 700;
const INTERVAL_MS = 5500;

function isRemoteSrc(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function shouldShowTitle(title?: string | null) {
  const t = title?.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  return lower !== "promoción" && lower !== "promocion";
}

export function PromoCarousel({ slides = defaultSlides }: { slides?: Slide[] }) {
  const [index, setIndex] = useState(0);
  const safeSlides = slides.length > 0 ? slides : defaultSlides;
  const allHaveImages = safeSlides.every((s) => Boolean(s.imageUrl?.trim()));
  const active = safeSlides[index];
  const activeLink = active.linkUrl?.trim() || null;

  useEffect(() => {
    if (safeSlides.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  const dots = (
    <div className="pointer-events-auto absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2 px-4">
      {safeSlides.map((slide, i) => (
        <button
          key={slide.id || i}
          type="button"
          aria-label={`Slide ${i + 1}`}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === index ? "w-8 bg-white shadow" : "w-2 bg-white/50 hover:bg-white/70"
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIndex(i);
          }}
        />
      ))}
    </div>
  );

  const frame = allHaveImages ? (
    <div className="relative aspect-[16/6] w-full bg-slate-100 sm:aspect-[21/7]">
      {safeSlides.map((slide, i) => {
        const src = resolveProductImageUrl(slide.imageUrl);
        const showTitle = shouldShowTitle(slide.title);
        const visible = i === index;
        return (
          <div
            key={slide.id || i}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{
              opacity: visible ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
              zIndex: visible ? 1 : 0,
            }}
            aria-hidden={!visible}
          >
            <Image
              src={src}
              alt={showTitle ? slide.title! : "Promoción AQUA"}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority={i === 0}
              unoptimized={isRemoteSrc(src)}
            />
            {showTitle || slide.subtitle ? (
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-10 pt-16 text-center text-white transition-opacity ease-in-out"
                style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
              >
                {showTitle ? (
                  <h2 className="text-lg font-bold leading-tight sm:text-2xl">{slide.title}</h2>
                ) : null}
                {slide.subtitle ? (
                  <p className="mt-1 text-sm text-white/90 sm:text-base">{slide.subtitle}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {dots}
    </div>
  ) : (
    <div className="relative overflow-hidden">
      {safeSlides.map((slide, i) => {
        const visible = i === index;
        return (
          <div
            key={slide.id || i}
            className={`absolute inset-0 bg-gradient-to-br px-6 py-10 text-center text-white transition-opacity ease-in-out sm:py-14 ${
              slide.gradient ?? "from-teal-600 via-teal-500 to-cyan-500"
            }`}
            style={{
              opacity: visible ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
              zIndex: visible ? 1 : 0,
              position: i === 0 ? "relative" : "absolute",
            }}
            aria-hidden={!visible}
          >
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                {slide.title || "Nueva promoción"}
              </h2>
              {slide.subtitle ? (
                <p className="mt-2 text-base text-white/90">{slide.subtitle}</p>
              ) : null}
            </div>
          </div>
        );
      })}
      {dots}
    </div>
  );

  return (
    <section className="overflow-hidden rounded-2xl shadow-md">
      {activeLink ? (
        <Link href={activeLink} className="relative block">
          {frame}
        </Link>
      ) : (
        <div className="relative">{frame}</div>
      )}
    </section>
  );
}
