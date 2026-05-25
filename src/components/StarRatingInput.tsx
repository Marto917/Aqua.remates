"use client";

import { useState } from "react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md";
};

export function StarRatingInput({ value, onChange, max = 5, size = "md" }: Props) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const starClass = size === "sm" ? "text-xl" : "text-3xl";

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label="Elegí tu puntuación"
      onMouseLeave={() => setHover(0)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= display;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHover(starValue)}
            className={`${starClass} leading-none transition hover:scale-110 ${
              filled ? "text-amber-400" : "text-slate-300"
            }`}
            aria-label={`${starValue} estrella${starValue > 1 ? "s" : ""}`}
            aria-pressed={value === starValue}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
