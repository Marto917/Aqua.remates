import Link from "next/link";
import packageJson from "../../package.json";

/** Editá acá URL y teléfonos cuando los tengas */
const SOCIAL = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
} as const;

const WHATSAPP = "";

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
      <path d="M16.6 5.82A5.74 5.74 0 0 1 13.36 2H10.4v11.83a2.7 2.7 0 1 1-2.7-2.7c.2 0 .4.03.58.07V8.16a5.66 5.66 0 1 0 5.77 5.66V8.37a8.9 8.9 0 0 0 5.2 1.66V7.1a5.8 5.8 0 0 1-2.65-1.28Z" />
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
  const wa = WHATSAPP.trim() || "—";

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
          <p className="mt-3 text-sm leading-relaxed text-white/90">
            <span className="block">WhatsApp {wa}</span>
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
            <SocialIconTiktok className="h-6 w-6 sm:h-5 sm:w-5" />
          </a>
        </div>

        <p className="mx-auto mt-8 max-w-[20rem] text-balance text-xs leading-relaxed text-white/50 sm:max-w-lg">
          Los precios y disponibilidad pueden variar. Consultá por medios oficiales antes de abonar.
        </p>
        <p className="mx-auto mt-4 max-w-[20rem] text-balance text-[11px] leading-relaxed text-white/45 sm:mt-3 sm:max-w-lg sm:text-xs">
          © {y} Aqua Remates. Todos los derechos reservados.
        </p>
        <p
          className="mt-3 text-center text-[9px] leading-none text-white/20 tabular-nums sm:text-[10px]"
          aria-hidden
        >
          v{packageJson.version}
        </p>
      </div>
    </footer>
  );
}
