"use client";

import Image from "next/image";
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
    title: "Compra mayorista",
    subtitle: "Activá el modo mayorista y armá tu pedido con mejores precios.",
    gradient: "from-emerald-700 via-teal-600 to-teal-700",
  },
];

export function PromoCarousel({ slides = defaultSlides }: { slides?: Slide[] }) {
  const [index, setIndex] = useState(0);
  const safeSlides = slides.length > 0 ? slides : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  const s = safeSlides[index];
  const content = (
    <>
      {s.imageUrl ? (
        <Image
          src={resolveProductImageUrl(s.imageUrl)}
          alt={s.title ?? "Promoción"}
          fill
          className="object-cover"
        />
      ) : null}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          s.gradient ?? "from-teal-600 via-teal-500 to-cyan-500"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-900/25" />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-70" />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Promociones</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
          {s.title || "Nueva promoción"}
        </h2>
        {s.subtitle ? <p className="mt-2 text-base text-white/90">{s.subtitle}</p> : null}
        <div className="mt-6 flex justify-center gap-2">
          {safeSlides.map((slide, i) => (
            <button
              key={slide.id || i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-6 py-10 text-center text-white shadow-md transition-[background] duration-500 sm:py-14"
    >
      {content}
    </section>
  );
}
