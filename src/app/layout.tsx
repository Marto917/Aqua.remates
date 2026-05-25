import type { Metadata } from "next";
import "./globals.css";
import { MobileCartBar } from "@/components/MobileCartBar";
import { StoreNav } from "@/components/nav/StoreNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "@/app/providers";
import { getSafeSession } from "@/lib/get-session";

/** Sesión en el layout usa headers; evita fallos de prerender / CSR bailout en Vercel. */
export const dynamic = "force-dynamic";

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
          <StoreNav session={session} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 pb-28 sm:px-4 sm:py-8 sm:pb-8">
            {children}
          </main>
          <SiteFooter />
          <MobileCartBar />
        </Providers>
      </body>
    </html>
  );
}
