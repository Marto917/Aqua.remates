"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { displayFirstName, resolveUserAvatarUrl } from "@/lib/user-avatar";

type Props = {
  name: string;
  imageUrl: string | null;
};

export function CustomerAccountMenu({ name, imageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const avatar = resolveUserAvatarUrl(imageUrl);
  const firstName = displayFirstName(name);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-1.5 shadow-sm transition hover:bg-slate-50 sm:min-h-11 sm:gap-2 sm:pr-3"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Mi cuenta"
      >
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brand-muted sm:h-9 sm:w-9">
          <Image
            src={avatar}
            alt=""
            width={36}
            height={36}
            className="h-full w-full object-cover"
            unoptimized={avatar.startsWith("http")}
          />
        </span>
        <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-slate-800 sm:inline">
          {firstName}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(13rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
            Hola, <span className="font-semibold text-slate-800">{firstName}</span>
          </p>
          <Link
            href="/cuenta/perfil"
            role="menuitem"
            className="block px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-brand/5"
            onClick={() => setOpen(false)}
          >
            Mi perfil
          </Link>
          <Link
            href="/cuenta/mis-compras"
            role="menuitem"
            className="block px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-brand/5"
            onClick={() => setOpen(false)}
          >
            Mis compras
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
