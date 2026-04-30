import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

/** Sesión en el layout usa headers; evita fallos de prerender / CSR bailout en Vercel. */
export const dynamic = "force-dynamic";
import "./globals.css";
import { MobileCartBar } from "@/components/MobileCartBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "@/app/providers";
import { getSafeSession } from "@/lib/get-session";

export const metadata: Metadata = {
  title: "AQUA — Tienda",
  description: "Bazar y hogar — compra minorista o mayorista",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSafeSession();

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <Providers>
        <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
          <nav className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-3 py-3 sm:flex-row sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 font-semibold text-brand-dark sm:justify-start"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand">
                <Image
                  src="/logo-aqua.png"
                  alt="AQUA"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  priority
                  unoptimized
                />
              </span>
              <span className="text-lg tracking-tight">AQUA</span>
            </Link>
            <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-2 sm:w-auto sm:max-w-none sm:justify-end sm:gap-x-3">
              <Link
                href="/catalog"
                className="min-h-11 min-w-[5.5rem] rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 active:bg-slate-50 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-0 sm:hover:text-brand-dark"
              >
                Catálogo
              </Link>
              <Link
                href="/carrito"
                className="min-h-11 min-w-[5.5rem] rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 active:bg-slate-50 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-0 sm:hover:text-brand-dark"
              >
                Carrito
              </Link>
              <Link
                href="/mayorista/contacto"
                className="min-h-11 min-w-[5.5rem] rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 active:bg-slate-50 sm:min-h-0 sm:min-w-0 sm:px-0 sm:py-0 sm:hover:text-brand-dark"
              >
                Mayorista
              </Link>
              {!session?.user ? (
                <>
                  <Link
                    href="/login"
                    className="min-h-11 rounded-full border border-brand bg-white px-3 py-2 text-sm font-semibold text-brand-dark active:bg-brand-muted/50 sm:min-h-0 sm:py-1.5 sm:hover:bg-brand-muted/50"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/registro"
                    className="min-h-11 rounded-full bg-brand px-3 py-2 text-sm font-semibold text-white active:bg-brand-dark sm:min-h-0 sm:py-1.5 sm:hover:bg-brand-dark"
                  >
                    Registrarte
                  </Link>
                </>
              ) : null}
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 pb-28 sm:px-4 sm:py-8 sm:pb-8">{children}</main>
        <SiteFooter />
        <MobileCartBar />
        </Providers>
      </body>
    </html>
  );
}
