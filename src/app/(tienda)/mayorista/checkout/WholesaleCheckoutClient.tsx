"use client";

import Link from "next/link";

type Props = {
  loggedIn: boolean;
  emailVerified: boolean;
  defaultName: string;
  defaultEmail: string;
};

export function WholesaleCheckoutClient(_props: Props) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <p className="font-semibold">Ventas mayoristas — próximamente</p>
      <p className="mt-2 text-sm">
        Estamos preparando el módulo mayorista. Por ahora podés comprar con precio transferencia desde el
        catálogo.
      </p>
      <Link href="/catalog" className="mt-4 inline-block text-sm font-medium underline">
        Volver al catálogo
      </Link>
    </div>
  );
}
