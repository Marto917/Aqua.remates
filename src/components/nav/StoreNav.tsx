import Link from "next/link";
import { CustomerAccountMenu } from "@/components/nav/CustomerAccountMenu";
import { SiteLogo } from "@/components/SiteLogo";
import { StoreNavLinks } from "@/components/nav/StoreNavLinks";
import { StoreNavToolbar } from "@/components/nav/StoreNavToolbar";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

type Props = {
  session: Session | null;
  logoUrl?: string | null;
};

export async function StoreNav({ session, logoUrl }: Props) {
  let profileImage: string | null = null;
  let profileName = session?.user?.name ?? "";

  // Solo contamos sesión “real” si hay id de usuario en el JWT (si no, el menú no aparecía).
  const userId = session?.user?.id?.trim() || null;
  const showAccountMenu = Boolean(userId);

  if (userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, imageUrl: true },
      });
      if (dbUser) {
        profileName = dbUser.name;
        profileImage = dbUser.imageUrl;
      } else if (session?.user?.image) {
        profileImage = session.user.image;
      }
    } catch {
      if (session?.user?.image) profileImage = session.user.image;
    }
  } else if (session?.user?.image) {
    profileImage = session.user.image;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 [--store-nav-height:3.5rem] sm:[--store-nav-height:4rem]">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center font-semibold text-brand-dark"
          aria-label="Inicio AQUA"
        >
          <SiteLogo logoUrl={logoUrl} />
        </Link>

        <StoreNavLinks />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <StoreNavToolbar />
          {showAccountMenu ? (
            <CustomerAccountMenu name={profileName || "Cuenta"} imageUrl={profileImage} />
          ) : (
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <Link
                href="/login"
                className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-full border border-brand px-2.5 py-1.5 text-[11px] font-semibold leading-none text-brand-dark hover:bg-brand/5 sm:min-h-10 sm:px-3.5 sm:text-xs"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-full bg-brand px-2.5 py-1.5 text-[11px] font-semibold leading-none text-white hover:bg-brand-dark sm:min-h-10 sm:px-3.5 sm:text-xs"
              >
                Registro
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
