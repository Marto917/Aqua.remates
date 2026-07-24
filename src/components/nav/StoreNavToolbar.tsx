"use client";

import Link from "next/link";
import { useState } from "react";
import { CartNavButton } from "@/components/CartNavButton";
import { IconHome, IconSearch } from "@/components/icons/NavIcons";
import { NavSearch } from "@/components/nav/NavSearch";

const mobileLinks = [
  { href: "/catalog", label: "Catálogo" },
  { href: "/promociones", label: "Promos" },
  { href: "/locales", label: "Locales" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function StoreNavToolbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex min-w-0 items-center justify-end gap-0 sm:gap-1">
      <Link
        href="/"
        className="hidden min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:flex sm:min-h-10 sm:min-w-10"
        aria-label="Inicio"
      >
        <IconHome />
      </Link>
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          setSearchOpen((v) => !v);
        }}
        className={`flex min-h-9 min-w-9 items-center justify-center rounded-lg active:bg-slate-100 sm:min-h-10 sm:min-w-10 ${
          searchOpen ? "bg-brand-muted text-brand-dark" : "text-slate-700"
        }`}
        aria-label="Buscar productos"
        aria-expanded={searchOpen}
      >
        <IconSearch />
      </button>
      <CartNavButton />
      <button
        type="button"
        onClick={() => {
          setSearchOpen(false);
          setMenuOpen((v) => !v);
        }}
        className={`flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 lg:hidden sm:min-h-10 sm:min-w-10 ${
          menuOpen ? "bg-brand-muted text-brand-dark" : ""
        }`}
        aria-label="Menú"
        aria-expanded={menuOpen}
      >
        <HamburgerIcon />
      </button>
      {searchOpen ? <NavSearch onOpenChange={setSearchOpen} /> : null}
      {menuOpen ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl lg:hidden">
          {mobileLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-slate-800 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
