"use client";

import Link from "next/link";
import { useState } from "react";
import { CartNavButton } from "@/components/CartNavButton";
import { IconCatalog, IconHome, IconSearch } from "@/components/icons/NavIcons";
import { NavSearch } from "@/components/nav/NavSearch";

export function StoreNavToolbar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-end gap-0.5 sm:gap-1">
      <Link
        href="/"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:min-h-10 sm:min-w-10"
        aria-label="Inicio"
      >
        <IconHome />
      </Link>
      <button
        type="button"
        onClick={() => setSearchOpen((v) => !v)}
        className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg active:bg-slate-100 sm:min-h-10 sm:min-w-10 ${
          searchOpen ? "bg-brand-muted text-brand-dark" : "text-slate-700"
        }`}
        aria-label="Buscar productos"
        aria-expanded={searchOpen}
      >
        <IconSearch />
      </button>
      <Link
        href="/catalog"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 sm:min-h-10 sm:min-w-10"
        aria-label="Catálogo"
      >
        <IconCatalog />
      </Link>
      <CartNavButton />
      {searchOpen ? <NavSearch onOpenChange={setSearchOpen} /> : null}
    </div>
  );
}
