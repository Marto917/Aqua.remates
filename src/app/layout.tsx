import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { getStoreSettings } from "@/lib/store-settings";
import { resolveProductImageUrl } from "@/lib/product-images";

export async function generateMetadata(): Promise<Metadata> {
  let logoPath = "/logo-aqua.png";
  try {
    const settings = await getStoreSettings();
    if (settings.brandLogoUrl?.trim()) {
      logoPath = resolveProductImageUrl(settings.brandLogoUrl);
    }
  } catch {
    /* usa logo por defecto */
  }

  return {
    title: "AQUA — Tienda",
    description: "Bazar y hogar — compra minorista o mayorista",
    icons: {
      icon: [{ url: logoPath }],
      shortcut: [{ url: logoPath }],
      apple: [{ url: logoPath }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
