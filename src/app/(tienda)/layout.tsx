import { MobileCartBar } from "@/components/MobileCartBar";
import { StoreNav } from "@/components/nav/StoreNav";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreThemeStyles } from "@/components/store/StoreThemeStyles";
import { StoreSettingsProvider } from "@/contexts/store-settings-context";
import { getSafeSession } from "@/lib/get-session";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

/** Solo rutas de clientes: catálogo, carrito, cuenta, etc. Sin panel admin. */
export default async function TiendaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSafeSession();
  const settings = await getStoreSettings();

  return (
    <StoreSettingsProvider initial={settings}>
      <StoreThemeStyles
        primary={settings.themeBrandPrimary}
        dark={settings.themeBrandDark}
        muted={settings.themeBrandMuted}
      />
      <StoreNav session={session} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 pb-28 sm:px-4 sm:py-8 sm:pb-8">
        {children}
      </main>
      <SiteFooter footerImageUrl={settings.footerImageUrl} />
      <MobileCartBar />
    </StoreSettingsProvider>
  );
}
