import Link from "next/link";
import { UserRole } from "@prisma/client";
import { CartNavButton } from "@/components/CartNavButton";
import { SignOutButton } from "@/components/SignOutButton";
import { IconCatalog, IconHome, IconSearch } from "@/components/icons/NavIcons";
import { SiteLogo } from "@/components/SiteLogo";
import { UserProfileChip } from "@/components/nav/UserProfileChip";
import { WholesaleModeToggle } from "@/components/nav/WholesaleModeToggle";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

type Props = {
  session: Session | null;
};

export async function StoreNav({ session }: Props) {
  let profileImage: string | null = null;
  let profileName = session?.user?.name ?? "";

  if (session?.user?.id && session.user.role === UserRole.CUSTOMER) {
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

  const isCustomer = session?.user?.role === UserRole.CUSTOMER;
  const isLoggedIn = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
      <nav className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center font-semibold text-brand-dark"
          aria-label="Inicio AQUA"
        >
          <SiteLogo />
        </Link>

        <div className="flex justify-center px-1">
          <WholesaleModeToggle />
        </div>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <Link
            href="/"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:min-h-10 sm:min-w-10"
            aria-label="Inicio"
          >
            <IconHome />
          </Link>
          <Link
            href="/#buscar"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:min-h-10 sm:min-w-10"
            aria-label="Buscar productos"
          >
            <IconSearch />
          </Link>
          <Link
            href="/catalog"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:min-h-10 sm:min-w-10"
            aria-label="Catálogo"
          >
            <IconCatalog />
          </Link>
          <CartNavButton />

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
                className="ml-0.5 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xs font-bold text-brand-dark sm:hidden"
                aria-label="Ingresar"
              >
                →
              </Link>
            </>
          ) : isCustomer ? (
            <>
              <div className="ml-1 hidden sm:block">
                <UserProfileChip name={profileName} imageUrl={profileImage} />
              </div>
              <div className="ml-1 hidden lg:block">
                <SignOutButton className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50" />
              </div>
            </>
          ) : null}
        </div>
      </nav>

      {session?.user && isCustomer ? (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 pb-2 sm:hidden">
          <UserProfileChip name={profileName} imageUrl={profileImage} />
          <SignOutButton className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600" />
        </div>
      ) : null}
    </header>
  );
}
