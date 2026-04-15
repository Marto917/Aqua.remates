import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import "./globals.css";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Aqua Commerce",
  description: "E-commerce B2C/B2B con gestión manual de disponibilidad",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body>
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-brand">
              Aqua Commerce
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/catalog">Catalogo</Link>
              <Link href="/checkout">Checkout Minorista</Link>
              <Link href="/mayorista/contacto">Contacto Mayorista</Link>
              {session?.user ? <Link href="/admin">Backoffice</Link> : <Link href="/login">Login</Link>}
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
