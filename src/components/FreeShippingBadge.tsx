import type { ProductFreeShippingDisplay } from "@/lib/free-shipping";

type Props = {
  display: ProductFreeShippingDisplay;
  /** overlay = sobre la imagen; inline = debajo del precio */
  variant?: "overlay" | "inline";
};

export function FreeShippingBadge({ display, variant = "overlay" }: Props) {
  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          display.definite ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
        }`}
      >
        {display.label}
      </span>
    );
  }

  return (
    <div
      className={`absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] rounded-full px-2.5 py-1 text-[10px] font-bold leading-tight text-white shadow-md sm:text-xs ${
        display.definite ? "bg-emerald-600" : "bg-sky-600"
      }`}
      title={display.label}
    >
      <span className="line-clamp-2">{display.label}</span>
    </div>
  );
}
