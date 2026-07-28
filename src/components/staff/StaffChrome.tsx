"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { SignOutButton } from "@/components/SignOutButton";
import { SiteLogo } from "@/components/SiteLogo";
import { StaffMobileNav } from "@/components/staff/StaffMobileNav";
import { StaffOrderAlerts } from "@/components/staff/StaffOrderAlerts";

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

function NavLabel({ label, badge }: { label: string; badge?: number }) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span>{label}</span>
      {badge != null && badge > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </span>
  );
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
  const [pendingPackCount, setPendingPackCount] = useState(0);

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-[padding] duration-200 ease-out ${
        sidebarOpen ? "lg:pl-60" : "lg:pl-0"
      }`}
    >
      <StaffOrderAlerts onCountChange={setPendingPackCount} />

      {/* Sidebar fijo (desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out lg:flex ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="border-b border-slate-100 px-4 py-4">
          <Link href={homeHref} className="inline-flex font-semibold text-brand-dark">
            <SiteLogo logoUrl={logoUrl} />
          </Link>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Panel {area === "admin" ? "admin" : "vendedor"}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Menú staff">
          <ul className="space-y-0.5">
            {links.map((item) => {
              const isEnvios = item.href === "/vendedor/envios";
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-muted hover:text-brand-dark"
                  >
                    <NavLabel label={item.label} badge={isEnvios ? pendingPackCount : undefined} />
                  </Link>
                </li>
              );
            })}
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

      {/* Pestana para abrir/cerrar menú (desktop) */}
      <button
        type="button"
        onClick={() => writeSidebarOpen(!sidebarOpen)}
        className={`fixed top-1/2 z-50 hidden h-16 w-5 -translate-y-1/2 items-center justify-center rounded-r-lg bg-slate-500 text-white shadow-sm transition-[left] duration-200 ease-out hover:bg-slate-600 lg:inline-flex ${
          sidebarOpen ? "left-60" : "left-0"
        }`}
        title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
        aria-label={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
        aria-expanded={sidebarOpen}
      >
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {sidebarOpen ? (
            <path d="M10 3.5 5.5 8 10 12.5" />
          ) : (
            <path d="M6 3.5 10.5 8 6 12.5" />
          )}
        </svg>
      </button>

      {/* Barra superior mobile */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <Link href={homeHref} className="font-semibold text-brand-dark">
            <SiteLogo logoUrl={logoUrl} />
          </Link>
          <div className="flex items-center gap-2">
            {pendingPackCount > 0 ? (
              <Link
                href="/vendedor/envios"
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white"
              >
                Armar
                <span>{pendingPackCount > 99 ? "99+" : pendingPackCount}</span>
              </Link>
            ) : null}
            <StaffMobileNav
              links={links}
              preview={preview}
              profileLine={profileLine}
              staffLogin={staffLogin}
              signedIn={signedIn}
              pendingPackCount={pendingPackCount}
            />
          </div>
        </div>
      </header>

      <div
        className={`mx-auto flex-1 px-4 pb-8 pt-4 transition-[max-width] duration-200 ${
          sidebarOpen ? "max-w-6xl" : "max-w-7xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
