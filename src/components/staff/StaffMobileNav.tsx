"use client";

import Link from "next/link";
import { useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

type StaffNavLink = {
  href: string;
  label: string;
};

type Props = {
  links: StaffNavLink[];
  preview: boolean;
  profileLine: string;
  staffLogin: string;
  signedIn: boolean;
  pendingPackCount?: number;
};

export function StaffMobileNav({
  links,
  preview,
  profileLine,
  staffLogin,
  signedIn,
  pendingPackCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800"
        aria-expanded={open}
        aria-label="Abrir menú"
      >
        Menú
        {pendingPackCount > 0 ? (
          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {pendingPackCount > 99 ? "99+" : pendingPackCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <nav className="max-h-[70vh] overflow-y-auto py-1">
              {links.map((item) => {
                const isEnvios = item.href === "/vendedor/envios";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <span>{item.label}</span>
                    {isEnvios && pendingPackCount > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {pendingPackCount > 99 ? "99+" : pendingPackCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 px-4 py-3">
              {preview ? (
                <p className="text-xs text-amber-800">Preview backoffice</p>
              ) : (
                <p className="text-xs text-slate-500">{profileLine}</p>
              )}
              {signedIn ? (
                <SignOutButton
                  callbackUrl={staffLogin}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                />
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
