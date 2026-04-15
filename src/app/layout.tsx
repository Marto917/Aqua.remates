import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

/** Sesión en el layout usa headers; evita fallos de prerender / CSR bailout en Vercel. */
export const dynamic = "force-dynamic";
import "./globals.css";
import { MobileCartBar } from "@/components/MobileCartBar";
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
  const isStaff =
    session?.user?.role === "OWNER" || session?.user?.role === "EMPLOYEE";

  return (
    <html lang="es">
      <body>
        <Providers>
        <header className="sticky top-0 z-40 border-b border-teal-100 bg-white shadow-sm">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-brand-dark">
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
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-medium text-slate-700">
              <Link href="/catalog" className="hover:text-brand-dark">
                Catálogo
              </Link>
              <Link href="/carrito" className="hover:text-brand-dark">
                Carrito
              </Link>
              <Link href="/mayorista/contacto" className="hidden hover:text-brand-dark sm:inline">
                Mayorista
              </Link>
              {isStaff ? (
                <Link href="/admin" className="rounded-full bg-brand px-3 py-1.5 text-white hover:bg-brand-dark">
                  Backoffice
                </Link>
              ) : session?.user ? (
                <Link href="/login" className="hover:text-brand-dark">
                  Cuenta
                </Link>
              ) : (
                <>
                  <Link href="/registro" className="hover:text-brand-dark">
                    Registro
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full bg-brand px-3 py-1.5 text-white hover:bg-brand-dark"
                  >
                    Ingresar
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-6 pb-28 sm:py-8">{children}</main>
        <MobileCartBar />
        </Providers>
      </body>
    </html>
  );
}
