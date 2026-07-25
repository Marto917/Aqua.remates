"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SignOutButton } from "@/components/SignOutButton";
import { SiteLogo } from "@/components/SiteLogo";
import { StaffMobileNav } from "@/components/staff/StaffMobileNav";

const STORAGE_KEY = "aqua-staff-sidebar-open";
const CHANGE_EVENT = "aqua-staff-sidebar";

export type StaffNavLink = {
  href: string;
  label: string;
};

type Props = {
  area: "admin" | "vendedor";
  homeHref: string;
  logoUrl?: string | null;
  links: StaffNavLink[];
  preview: boolean;
  profileLine: string;
  staffLogin: string;
  signedIn: boolean;
  children: React.ReactNode;
};

function readSidebarOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function subscribeSidebar(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

function writeSidebarOpen(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function StaffChrome({
  area,
  homeHref,
  logoUrl,
  links,
  preview,
  profileLine,
  staffLogin,
  signedIn,
  children,
}: Props) {
  const sidebarOpen = useSyncExternalStore(subscribeSidebar, readSidebarOpen, () => true);

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-[padding] duration-200 ease-out ${
        sidebarOpen ? "lg:pl-60" : "lg:pl-0"
      }`}
    >
      {/* Sidebar fijo (desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out lg:flex ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-4">
          <div className="min-w-0">
            <Link href={homeHref} className="inline-flex font-semibold text-brand-dark">
              <SiteLogo logoUrl={logoUrl} />
            </Link>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Panel {area === "admin" ? "admin" : "vendedor"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => writeSidebarOpen(false)}
            className="mt-0.5 shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            title="Ocultar menú"
            aria-label="Ocultar menú"
          >
            «
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Menú staff">
          <ul className="space-y-0.5">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-muted hover:text-brand-dark"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          {preview ? (
            <span className="block rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
              Preview backoffice
            </span>
          ) : (
            <p className="px-1 text-xs text-slate-500">
              <strong className="text-slate-800">{profileLine}</strong>
            </p>
          )}
          {signedIn ? (
            <SignOutButton
              callbackUrl={staffLogin}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            />
          ) : null}
        </div>
      </aside>

      {/* Botón para reabrir menú cuando está oculto */}
      {!sidebarOpen ? (
        <button
          type="button"
          onClick={() => writeSidebarOpen(true)}
          className="fixed left-3 top-3 z-40 hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 lg:inline-flex"
          aria-label="Mostrar menú"
        >
          <span aria-hidden>»</span>
          Menú
        </button>
      ) : null}

      {/* Barra superior mobile */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <Link href={homeHref} className="font-semibold text-brand-dark">
            <SiteLogo logoUrl={logoUrl} />
          </Link>
          <StaffMobileNav
            links={links}
            preview={preview}
            profileLine={profileLine}
            staffLogin={staffLogin}
            signedIn={signedIn}
          />
        </div>
      </header>

      <div
        className={`mx-auto flex-1 px-4 pb-8 transition-[max-width,padding] duration-200 ${
          sidebarOpen ? "max-w-6xl pt-4" : "max-w-7xl pt-4 lg:pt-14"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
