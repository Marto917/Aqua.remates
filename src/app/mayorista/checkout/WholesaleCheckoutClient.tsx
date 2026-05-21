"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { getFinalUnitPrice } from "@/lib/catalog-pricing";
import { formatDisplayWords } from "@/lib/display-text";
import { retailShippingMethodLabel } from "@/lib/order-labels";
import { getEffectivePriceModeForProduct } from "@/lib/wholesale-pricing";

type ShippingChoice = "PICKUP" | "DELIVERY" | "SHIPPING_TO_COORDINATE";

type Props = {
  loggedIn: boolean;
  emailVerified: boolean;
  defaultName: string;
  defaultEmail: string;
};

export function WholesaleCheckoutClient({
  loggedIn,
  emailVerified,
  defaultName,
  defaultEmail,
}: Props) {
  const router = useRouter();
  const { lines, mode, subtotalDisplay, totalsByProduct, clearLines } = useCart();
  const [companyName, setCompanyName] = useState("");
  const [cuit, setCuit] = useState("");
  const [contactName, setContactName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingChoice>("SHIPPING_TO_COORDINATE");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ requestId: string } | null>(null);

  const lineSummaries = useMemo(() => {
    return lines.map((line) => {
      const eff = getEffectivePriceModeForProduct(mode, line.productId, totalsByProduct);
      const unit = getFinalUnitPrice(
        {
          retailPrice: line.retailPrice,
          wholesalePrice: line.wholesalePrice,
          discountRetailPercent: line.discountRetailPercent,
          discountWholesalePercent: line.discountWholesalePercent,
        },
        eff,
      );
      return { ...line, unit, lineTotal: unit * line.quantity, eff };
    });
  }, [lines, mode, totalsByProduct]);

  if (!loggedIn) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Necesitás una cuenta de cliente</p>
        <p className="mt-2 text-sm">Registrate e iniciá sesión para enviar pedidos mayoristas desde el carrito.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/registro" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
            Registrarte
          </Link>
          <Link href="/login?callbackUrl=/mayorista/checkout" className="text-sm font-medium underline">
            Ingresar
          </Link>
        </div>
      </div>
    );
  }

  if (!emailVerified) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Verificá tu email</p>
        <p className="mt-2 text-sm">
          Antes de enviar un pedido mayorista tenés que confirmar el enlace que te enviamos al registrarte.
        </p>
      </div>
    );
  }

  if (mode !== "wholesale") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Activá el modo mayorista</p>
        <p className="mt-2 text-sm">En el catálogo cambiá a precio mayorista y volvé a armar el carrito.</p>
        <Link href="/catalog" className="mt-4 inline-block text-sm font-medium underline">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  if (lines.length === 0 && !done) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
        Tu carrito está vacío.{" "}
        <Link href="/catalog" className="font-medium text-brand underline">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <h2 className="text-lg font-semibold">Pedido enviado</h2>
        <p className="text-sm">
          Tu solicitud quedó <strong>pendiente de confirmación</strong> por nuestro equipo comercial. Te avisaremos
          por email cuando la confirmen o si necesitan ajustar algo.
        </p>
        <p className="text-xs font-mono text-emerald-800">Referencia: {done.requestId}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/cuenta/pedidos-mayorista" className="text-sm font-medium underline">
            Ver mis pedidos mayorista
          </Link>
          <Link href="/catalog" className="text-sm font-medium underline">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/wholesale-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          cuit,
          contactName,
          email,
          phone: phone || undefined,
          address: address || undefined,
          notes: notes || undefined,
          shippingMethod,
          shippingAddress: shippingMethod === "DELIVERY" ? shippingAddress : undefined,
          shippingCity: shippingMethod === "DELIVERY" ? shippingCity : undefined,
          shippingProvince: shippingMethod === "DELIVERY" ? shippingProvince : undefined,
          shippingPostalCode: shippingMethod === "DELIVERY" ? shippingPostalCode : undefined,
          shippingNotes: shippingNotes || undefined,
          lines: lines.map((l) => ({
            variantId: l.variantId,
            productId: l.productId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string; requestId?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar el pedido.");
        return;
      }
      clearLines();
      setDone({ requestId: data.requestId ?? "" });
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Datos del comercio</h2>
          <div className="mt-4 space-y-3">
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Razón social / nombre del comercio"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              required
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              placeholder="CUIT"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nombre de contacto"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono / WhatsApp"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección fiscal o de entrega habitual (opcional)"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Envío</h2>
          <div className="mt-4 space-y-2">
            {(["PICKUP", "DELIVERY", "SHIPPING_TO_COORDINATE"] as const).map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === key}
                  onChange={() => setShippingMethod(key)}
                  className="mt-1"
                />
                <span className="text-sm font-medium">{retailShippingMethodLabel[key]}</span>
              </label>
            ))}
          </div>
          {shippingMethod === "DELIVERY" && (
            <div className="mt-3 space-y-3">
              <input
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Calle y número"
                className="w-full rounded-md border px-3 py-2"
              />
              <input
                required
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                placeholder="Ciudad"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          )}
          <textarea
            value={shippingNotes}
            onChange={(e) => setShippingNotes(e.target.value)}
            rows={2}
            placeholder="Indicaciones de envío (opcional)"
            className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
          />
        </section>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas del pedido (opcional)"
          className="w-full rounded-md border bg-white px-3 py-2"
        />

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Al enviar, un vendedor revisará cantidades y precios mayoristas. No se cobra online: te confirmamos condiciones
          de pago y entrega.
        </p>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Enviando…" : "Enviar pedido mayorista"}
        </button>
      </div>

      <aside className="h-fit rounded-xl border bg-white p-5 lg:sticky lg:top-4">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <ul className="mt-4 divide-y text-sm">
          {lineSummaries.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{formatDisplayWords(line.productName)}</p>
                <p className="text-xs text-slate-500">
                  {formatDisplayWords(line.colorLabel)} × {line.quantity}
                  {line.eff === "wholesale" ? " · precio mayorista" : " · precio minorista (faltan unidades)"}
                </p>
              </div>
              <p className="font-medium whitespace-nowrap">
                {line.lineTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4">
          <span className="text-slate-600">Total estimado</span>
          <span className="text-xl font-bold text-brand-dark">{subtotalDisplay}</span>
        </div>
        <Link href="/carrito" className="mt-4 block text-center text-sm text-brand-dark underline">
          Editar carrito
        </Link>
      </aside>
    </form>
  );
}
