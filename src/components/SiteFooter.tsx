import Link from "next/link";

/** Editá acá URL y teléfonos cuando los tengas */
const SOCIAL = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
} as const;

const PHONES = {
  /** Ej: "11 1234-5678" o dejá "" para mostrar guión */
  telefono: "",
  whatsapp: "",
};

function SocialIconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function SocialIconTiktok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.01-1-.01-1.49 0-1.5 0-3.01.01-4.51.33-1.5 1.2-2.9 2.5-3.8 1.2-.8 2.7-1.1 4.1-.9.1.01.2.04.2.16v3.4c-.6-.1-1.2-.1-1.8.1-.5.2-.9.5-1.1 1-.2.4-.2.8-.1 1.2.1.3.2.5.4.7.2.2.4.3.7.3.2.1.4.1.6.1.1 0 .2 0 .3-.01.3-.1.5-.2.7-.4.2-.2.3-.4.4-.6.1-.2.1-.4.1-.6.01-2.11 0-4.22.01-6.32z" />
    </svg>
  );
}

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalog?priceMode=retail", label: "Catálogo" },
  { href: "/carrito", label: "Carrito" },
  { href: "/mayorista/contacto", label: "Mayorista" },
  { href: "/login", label: "Ingresar" },
] as const;

export function SiteFooter() {
  const y = new Date().getFullYear();
  const tel = PHONES.telefono.trim() || "—";
  const wa = PHONES.whatsapp.trim() || "—";

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-white/10 bg-slate-950 pb-[max(1rem,env(safe-area-inset-bottom))] text-white sm:mt-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_50%_-20%,rgba(20,184,166,0.25),transparent_55%),radial-gradient(800px_400px_at_80%_100%,rgba(15,118,110,0.2),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 text-center sm:px-5 sm:py-14">
        <nav
          className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-0.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-1"
          aria-label="Pie de página"
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-[3rem] w-full content-center rounded-lg text-xs font-semibold uppercase tracking-[0.18em] text-white/90 active:bg-white/5 sm:min-h-0 sm:w-auto sm:px-1 sm:py-2 sm:tracking-[0.2em] sm:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mx-auto mt-8 w-full max-w-sm rounded-xl border border-white/25 bg-white/5 px-5 py-4 text-center backdrop-blur-sm sm:max-w-md sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">Contacto</p>
          <p className="mt-3 space-y-1.5 text-sm leading-relaxed text-white/90 sm:mt-2 sm:space-y-0">
            <span className="block sm:inline">Tel. {tel}</span>
            <span className="hidden text-white/30 sm:mx-2 sm:inline" aria-hidden>
              ·
            </span>
            <span className="block sm:inline">WhatsApp {wa}</span>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-5 sm:gap-6">
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition active:scale-95 active:bg-white/20 sm:h-12 sm:w-12 sm:hover:border-white/50 sm:hover:bg-white/15"
            aria-label="Instagram AQUA"
          >
            <SocialIconInstagram className="h-6 w-6 sm:h-5 sm:w-5" />
          </a>
          <a
            href={SOCIAL.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition active:scale-95 active:bg-white/20 sm:h-12 sm:w-12 sm:hover:border-white/50 sm:hover:bg-white/15"
            aria-label="TikTok AQUA"
          >
            <SocialIconTikTok className="h-6 w-6 sm:h-5 sm:w-5" />
          </a>
        </div>

        <p className="mx-auto mt-8 max-w-[20rem] text-balance text-xs leading-relaxed text-white/50 sm:max-w-lg">
          Los precios y disponibilidad pueden variar. Consultá por medios oficiales antes de abonar.
        </p>
        <p className="mx-auto mt-4 max-w-[20rem] text-balance text-[11px] leading-relaxed text-white/45 sm:mt-3 sm:max-w-lg sm:text-xs">
          © {y} AQUA — Bazar y hogar. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
