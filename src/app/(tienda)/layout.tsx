import { MobileCartBar } from "@/components/MobileCartBar";
import { StoreNav } from "@/components/nav/StoreNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getSafeSession } from "@/lib/get-session";

export const dynamic = "force-dynamic";

/** Solo rutas de clientes: catálogo, carrito, cuenta, etc. Sin panel admin. */
export default async function TiendaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSafeSession();

  return (
    <>
      <StoreNav session={session} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 pb-28 sm:px-4 sm:py-8 sm:pb-8">
        {children}
      </main>
      <SiteFooter />
      <MobileCartBar />
    </>
  );
}
