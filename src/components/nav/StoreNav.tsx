import Link from "next/link";
import { UserRole } from "@prisma/client";
import { CustomerAccountMenu } from "@/components/nav/CustomerAccountMenu";
import { SiteLogo } from "@/components/SiteLogo";
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
    <header className="sticky top-0 z-40 overflow-x-clip border-b border-teal-100 bg-white/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 [--store-nav-height:3.25rem] sm:[--store-nav-height:3.75rem]">
      <nav className="mx-auto grid max-w-6xl grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-center gap-1 px-2 py-2 sm:grid-cols-[auto_1fr_auto] sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center font-semibold text-brand-dark"
          aria-label="Inicio AQUA"
        >
          <SiteLogo logoUrl={logoUrl} />
        </Link>

        <div className="hidden min-w-0 justify-center px-1 sm:flex">
          <WholesaleModeToggle />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-0 sm:gap-1">
          <StoreNavToolbar />
          {!isLoggedIn ? (
            <div className="ml-0.5 flex shrink-0 items-center gap-0.5 sm:ml-1 sm:gap-1.5">
              <Link
                href="/login"
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-brand px-2 py-1 text-[10px] font-semibold leading-none text-brand-dark hover:bg-brand/5 sm:min-h-10 sm:px-3.5 sm:py-1.5 sm:text-xs"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="hidden min-h-9 items-center justify-center rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold leading-none text-white hover:bg-brand-dark min-[400px]:inline-flex sm:min-h-10 sm:px-3.5 sm:py-1.5 sm:text-xs"
              >
                Registro
              </Link>
            </div>
          ) : isCustomer ? (
            <CustomerAccountMenu name={profileName} imageUrl={profileImage} />
          ) : null}
        </div>
      </nav>
    </header>
  );
}
