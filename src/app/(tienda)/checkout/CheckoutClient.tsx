"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { BANK_TRANSFER } from "@/lib/constants";
import { getFinalUnitPrice } from "@/lib/catalog-pricing";
import { getEffectivePriceModeForProduct } from "@/lib/wholesale-pricing";
import { formatDisplayWords } from "@/lib/display-text";
import { retailShippingMethodLabel } from "@/lib/order-labels";

type PaymentChoice = "BANK_TRANSFER" | "MERCADO_PAGO";
type ShippingChoice = "PICKUP" | "DELIVERY" | "SHIPPING_TO_COORDINATE";

export function CheckoutClient({ mercadoPagoEnabled }: { mercadoPagoEnabled: boolean }) {
  const router = useRouter();
  const { lines, mode, subtotalDisplay, totalsByProduct, clearLines } = useCart();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>(
    mercadoPagoEnabled ? "MERCADO_PAGO" : "BANK_TRANSFER",
  );
  const [shippingMethod, setShippingMethod] = useState<ShippingChoice>("PICKUP");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferDone, setTransferDone] = useState<{ orderId: string } | null>(null);

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
      return {
        ...line,
        unit,
        lineTotal: unit * line.quantity,
      };
    });
  }, [lines, mode, totalsByProduct]);

  if (mode === "wholesale") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Tu carrito está en modo mayorista.</p>
        <p className="mt-2 text-sm">
          Este checkout es solo para compras minoristas. Cambiá a modo minorista en el catálogo o usá el flujo mayorista.
        </p>
        <Link href="/carrito" className="mt-4 inline-block text-sm font-medium underline">
          Volver al carrito
        </Link>
      </div>
    );
  }

  if (lines.length === 0 && !transferDone) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
        No hay productos en el carrito.{" "}
        <Link href="/catalog" className="font-medium text-brand underline">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  if (transferDone) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
          <h2 className="text-lg font-semibold">Pedido registrado</h2>
          <p className="mt-2 text-sm">
            Número de pedido: <span className="font-mono text-xs">{transferDone.orderId}</span>
          </p>
          <p className="mt-2 text-sm">
            Realizá la transferencia por el total indicado. Cuando la acreditemos, te confirmamos el pedido.
          </p>
        </div>
        <aside className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-slate-900">Datos para transferir</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <strong>Titular:</strong> {BANK_TRANSFER.holder}
            </li>
            <li>
              <strong>Alias:</strong> {BANK_TRANSFER.alias}
            </li>
            <li>
              <strong>CBU:</strong> {BANK_TRANSFER.cbu}
            </li>
          </ul>
        </aside>
        <Link href="/catalog" className="inline-block text-sm font-medium text-brand-dark underline">
          Seguir comprando
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/retail-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || undefined,
          notes: notes || undefined,
          paymentMethod,
          shippingMethod,
          shippingAddress: shippingMethod === "DELIVERY" ? shippingAddress : undefined,
          shippingCity: shippingMethod === "DELIVERY" ? shippingCity : undefined,
          shippingProvince: shippingMethod === "DELIVERY" ? shippingProvince : undefined,
          shippingPostalCode: shippingMethod === "DELIVERY" ? shippingPostalCode : undefined,
          shippingNotes: shippingNotes || undefined,
          mode: "retail",
          lines: lines.map((l) => ({
            variantId: l.variantId,
            productId: l.productId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        orderId?: string;
        initPoint?: string;
        paymentMethod?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar el pedido.");
        return;
      }
      if (data.paymentMethod === "MERCADO_PAGO" && data.initPoint) {
        clearLines();
        window.location.href = data.initPoint;
        return;
      }
      clearLines();
      setTransferDone({ orderId: data.orderId ?? "" });
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
          <h2 className="text-lg font-semibold text-slate-900">Tus datos</h2>
          <div className="mt-4 space-y-3">
            <input
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              required
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md border px-3 py-2"
            />
            <input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="Teléfono / WhatsApp (recomendado)"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Forma de envío</h2>
          <div className="mt-4 space-y-2">
            {(["PICKUP", "DELIVERY", "SHIPPING_TO_COORDINATE"] as const).map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
              >
                <input
                  type="radio"
                  name="shipping"
                  value={key}
                  checked={shippingMethod === key}
                  onChange={() => setShippingMethod(key)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-slate-900">{retailShippingMethodLabel[key]}</span>
                  {key === "PICKUP" && (
                    <span className="mt-0.5 block text-xs text-slate-500">Retirás en nuestro local cuando te avisemos.</span>
                  )}
                  {key === "DELIVERY" && (
                    <span className="mt-0.5 block text-xs text-slate-500">Enviamos a la dirección que indiques.</span>
                  )}
                  {key === "SHIPPING_TO_COORDINATE" && (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Te contactamos para coordinar envío y costo.
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {shippingMethod === "DELIVERY" && (
            <div className="mt-4 space-y-3">
              <input
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Calle y número"
                className="w-full rounded-md border px-3 py-2"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="Ciudad"
                  className="w-full rounded-md border px-3 py-2"
                />
                <input
                  value={shippingProvince}
                  onChange={(e) => setShippingProvince(e.target.value)}
                  placeholder="Provincia"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              <input
                value={shippingPostalCode}
                onChange={(e) => setShippingPostalCode(e.target.value)}
                placeholder="Código postal (opcional)"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          )}
          {(shippingMethod === "SHIPPING_TO_COORDINATE" || shippingMethod === "PICKUP") && (
            <textarea
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
              rows={2}
              placeholder="Indicaciones de envío o retiro (opcional)"
              className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
            />
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Forma de pago</h2>
          <div className="mt-4 space-y-2">
            {mercadoPagoEnabled && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "MERCADO_PAGO"}
                  onChange={() => setPaymentMethod("MERCADO_PAGO")}
                />
                <span className="font-medium">Mercado Pago (tarjeta, débito, etc.)</span>
              </label>
            )}
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "BANK_TRANSFER"}
                onChange={() => setPaymentMethod("BANK_TRANSFER")}
              />
              <span className="font-medium">Transferencia bancaria</span>
            </label>
          </div>
          {paymentMethod === "BANK_TRANSFER" && (
            <p className="mt-3 text-xs text-slate-600">
              Al confirmar verás alias y CBU. El pedido queda pendiente hasta que validemos la transferencia.
            </p>
          )}
        </section>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas del pedido (opcional)"
          className="w-full rounded-md border bg-white px-3 py-2"
        />

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting
            ? "Procesando…"
            : paymentMethod === "MERCADO_PAGO"
              ? "Pagar con Mercado Pago"
              : "Confirmar pedido por transferencia"}
        </button>
      </div>

      <aside className="h-fit rounded-xl border bg-white p-5 lg:sticky lg:top-4">
        <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {lineSummaries.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{formatDisplayWords(line.productName)}</p>
                <p className="text-xs text-slate-500">
                  {formatDisplayWords(line.colorLabel)} × {line.quantity}
                </p>
              </div>
              <p className="font-medium whitespace-nowrap">
                {line.lineTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4">
          <span className="text-slate-600">Total</span>
          <span className="text-xl font-bold text-brand-dark">{subtotalDisplay}</span>
        </div>
        <Link href="/carrito" className="mt-4 block text-center text-sm text-brand-dark underline">
          Editar carrito
        </Link>
      </aside>
    </form>
  );
}
