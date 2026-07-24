import Link from "next/link";

const links = [
  { href: "/catalog", label: "Catálogo" },
  { href: "/promociones", label: "Promociones" },
  { href: "/locales", label: "Locales" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function StoreNavLinks() {
  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex lg:gap-2"
      aria-label="Secciones"
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-800 transition hover:bg-slate-50 hover:text-brand-dark xl:px-3 xl:text-xs"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
