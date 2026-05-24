import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "customer" | "staff";
};

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  variant = "customer",
}: AuthPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className={`overflow-hidden rounded-2xl border shadow-lg ${
          variant === "staff"
            ? "border-slate-300 bg-gradient-to-b from-slate-50 to-white"
            : "border-teal-100/80 bg-gradient-to-b from-white via-white to-brand-muted/30"
        }`}
      >
        <div
          className={`px-6 py-8 sm:px-8 ${
            variant === "staff"
              ? "border-b border-slate-200 bg-slate-900 text-white"
              : "border-b border-teal-100 bg-gradient-to-r from-brand/10 via-white to-brand-muted/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                variant === "staff" ? "bg-white/10 ring-2 ring-white/20" : "bg-brand ring-2 ring-brand/20"
              }`}
            >
              <Image
                src="/logo-aqua.png"
                alt="AQUA"
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            </span>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  variant === "staff" ? "text-slate-300" : "text-brand-dark"
                }`}
              >
                Aqua Remates
              </p>
              <h1 className={`text-xl font-bold ${variant === "staff" ? "text-white" : "text-slate-900"}`}>
                {title}
              </h1>
            </div>
          </div>
          <p className={`mt-3 text-sm leading-relaxed ${variant === "staff" ? "text-slate-300" : "text-slate-600"}`}>
            {subtitle}
          </p>
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
        {footer ? (
          <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 text-center text-sm text-slate-600 sm:px-8">
            {footer}
          </div>
        ) : null}
      </div>
      {variant === "customer" ? (
        <p className="mt-4 text-center text-sm text-slate-600">
          <Link href="/catalog" className="font-medium text-brand-dark hover:underline">
            ← Volver al catálogo
          </Link>
        </p>
      ) : null}
    </div>
  );
}
