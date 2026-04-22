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
          <Link href="/mayorista/contacto">Mayorista</Link>
          <Link href="/login?callbackUrl=/admin">Backoffice</Link>
        </nav>
      </div>
    </header>
  );
}
