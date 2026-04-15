"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    title: "Envíos a todo el país",
    subtitle: "Coordinamos entrega según tu zona.",
    gradient: "from-teal-600 via-teal-500 to-cyan-500",
  },
  {
    title: "Pagá con transferencia",
    subtitle: "Precio claro al finalizar tu pedido minorista.",
    gradient: "from-cyan-600 via-teal-600 to-emerald-600",
  },
  {
    title: "Compra mayorista",
    subtitle: "Activá el modo mayorista y armá tu pedido con mejores precios.",
    gradient: "from-emerald-700 via-teal-600 to-teal-700",
  },
];

export function PromoCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const s = slides[index];

  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} px-6 py-10 text-center text-white shadow-md transition-[background] duration-500 sm:py-14`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-90" />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Promociones</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{s.title}</h2>
        <p className="mt-2 text-base text-white/90">{s.subtitle}</p>
        <div className="mt-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/40"}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
