import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold text-brand-900">
          Aqua Commerce
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/catalog">Catalogo</Link>
          <Link href="/checkout?type=retail">Checkout Minorista</Link>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500"
          >
            Próximamente: mayorista
          </button>
          <Link href="/login?callbackUrl=/admin">Backoffice</Link>
        </nav>
      </div>
    </header>
  );
}
