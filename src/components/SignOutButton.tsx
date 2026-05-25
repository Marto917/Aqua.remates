"use client";

import { signOut } from "next-auth/react";

type Props = {
  callbackUrl?: string;
  className?: string;
  label?: string;
};

export function SignOutButton({
  callbackUrl = "/",
  className = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50",
  label = "Cerrar sesión",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => signOut({ callbackUrl })}
    >
      {label}
    </button>
  );
}
