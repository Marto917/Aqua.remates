"use client";

import { useEffect, useState } from "react";

const slides = [
  "Envios a todo el pais en 24/48 hs.",
  "Descuento especial por transferencia bancaria.",
  "Atencion consultiva para compras mayoristas.",
];

export function PromoCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="rounded-xl bg-brand px-6 py-8 text-center text-white">
      <p className="text-lg font-medium">{slides[index]}</p>
    </section>
  );
}
