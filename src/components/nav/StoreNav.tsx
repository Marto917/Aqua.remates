import Link from "next/link";
import { UserRole } from "@prisma/client";
import { CustomerAccountMenu } from "@/components/nav/CustomerAccountMenu";
import { SiteLogo } from "@/components/SiteLogo";
import { IconUser } from "@/components/icons/NavIcons";
import { StoreNavToolbar } from "@/components/nav/StoreNavToolbar";
import { WholesaleModeToggle } from "@/components/nav/WholesaleModeToggle";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

type Props = {
  session: Session | null;
  logoUrl?: string | null;
};

export async function StoreNav({ session, logoUrl }: Props) {
  let profileImage: string | null = null;
  let profileName = session?.user?.name ?? "";

  const isCustomer =
    session?.user?.role === UserRole.CUSTOMER ||
    (Boolean(session?.user?.id) && session?.user?.role !== UserRole.OWNER && session?.user?.role !== UserRole.EMPLOYEE);

  if (session?.user?.id && isCustomer) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, imageUrl: true },
    });
    if (dbUser) {
      profileName = dbUser.name;
      profileImage = dbUser.imageUrl;
    } else if (session.user.image) {
      profileImage = session.user.image;
    }
  }

  const isLoggedIn = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
      <nav className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center font-semibold text-brand-dark"
          aria-label="Inicio AQUA"
        >
          <SiteLogo logoUrl={logoUrl} />
        </Link>

        <div className="flex justify-center px-1">
          <WholesaleModeToggle />
        </div>

        <div className="flex items-center justify-end gap-0.5">
          <StoreNavToolbar />
          {!isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="ml-1 hidden min-h-10 rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand-dark sm:inline-flex sm:items-center"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="hidden min-h-10 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex sm:items-center"
              >
                Registro
              </Link>
              <Link
                href="/login"
                className="ml-0.5 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand/30 text-brand-dark hover:bg-brand/5 sm:hidden"
                aria-label="Ingresar"
              >
                <IconUser className="h-5 w-5" />
              </Link>
            </>
          ) : isCustomer ? (
            <CustomerAccountMenu name={profileName} imageUrl={profileImage} />
          ) : null}
        </div>
      </nav>
    </header>
  );
}
