import type { Metadata } from "next";
import "./globals.css";
import { MobileCartBar } from "@/components/MobileCartBar";
import { StoreNav } from "@/components/nav/StoreNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "@/app/providers";
import { getSafeSession } from "@/lib/get-session";
import { isStaffBackofficePath } from "@/lib/route-areas";
import { getRequestPathname } from "@/lib/request-pathname";

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
  const pathname = await getRequestPathname();
  const staffBackoffice = isStaffBackofficePath(pathname);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <Providers>
          {!staffBackoffice ? <StoreNav session={session} /> : null}
          <main
            className={`mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-4 sm:py-8 ${
              staffBackoffice ? "pb-8" : "pb-28 sm:pb-8"
            }`}
          >
            {children}
          </main>
          {!staffBackoffice ? <SiteFooter /> : null}
          {!staffBackoffice ? <MobileCartBar /> : null}
        </Providers>
      </body>
    </html>
  );
}
