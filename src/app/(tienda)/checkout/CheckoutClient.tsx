"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useStoreSettings } from "@/contexts/store-settings-context";
import { formatDisplayWords } from "@/lib/display-text";
import { retailShippingMethodLabel } from "@/lib/order-labels";
import { getMercadoPagoPrice, getTransferPrice } from "@/lib/store-pricing";

type PaymentChoice = "BANK_TRANSFER" | "MERCADO_PAGO";
type ShippingChoice = "PICKUP" | "DELIVERY" | "SHIPPING_TO_COORDINATE";

type TransferInfo = {
  holder: string;
  alias: string;
  cbu: string;
  notes?: string | null;
};

export function CheckoutClient({ mercadoPagoEnabled }: { mercadoPagoEnabled: boolean }) {
  const router = useRouter();
  const settings = useStoreSettings();
  const { lines, subtotalTransfer, subtotalTransferAmount, clearLines } = useCart();
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
  const [transferDone, setTransferDone] = useState<{ orderId: string; transfer: TransferInfo } | null>(
    null,
  );

  const lineSummaries = useMemo(() => {
    return lines.map((line) => {
      const product = {
        listPrice: line.listPrice,
        retailPrice: line.transferPrice,
        discountRetailPercent: line.discountPercent,
      };
      const transferUnit = getTransferPrice(product);
      const mpUnit = getMercadoPagoPrice(product, settings.mercadoPagoMarkupPercent);
      const unit = paymentMethod === "BANK_TRANSFER" ? transferUnit : mpUnit;
      return {
        ...line,
        transferUnit,
        mpUnit,
        unit,
        lineTotal: unit * line.quantity,
      };
    });
  }, [lines, paymentMethod, settings.mercadoPagoMarkupPercent]);

  const totalDisplay = useMemo(() => {
    const sum = lineSummaries.reduce((a, l) => a + l.lineTotal, 0);
    return sum.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  }, [lineSummaries]);

  const mpTotal = useMemo(() => {
    const sum = lineSummaries.reduce((a, l) => a + l.mpUnit * l.quantity, 0);
    return sum.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  }, [lineSummaries]);

  useEffect(() => {
    if (paymentMethod === "MERCADO_PAGO" && !mercadoPagoEnabled) {
      setPaymentMethod("BANK_TRANSFER");
    }
  }, [mercadoPagoEnabled, paymentMethod]);

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
    const t = transferDone.transfer;
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
              <strong>Titular:</strong> {t.holder}
            </li>
            <li>
              <strong>Alias:</strong> {t.alias}
            </li>
            <li>
              <strong>CBU:</strong> {t.cbu}
            </li>
            {t.notes ? (
              <li className="text-slate-600">{t.notes}</li>
            ) : null}
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
        transfer?: TransferInfo;
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
      setTransferDone({
        orderId: data.orderId ?? "",
        transfer: data.transfer ?? {
          holder: settings.bankHolder,
          alias: settings.bankAlias,
          cbu: settings.bankCbu,
          notes: settings.bankExtraNotes,
        },
      });
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
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Forma de pago</h2>
          <div className="mt-4 space-y-2">
            <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                />
                <span className="font-medium">Transferencia bancaria</span>
              </span>
              <span className="pl-7 text-sm text-brand-dark">
                Total: {subtotalTransfer} (mejor precio)
              </span>
            </label>
            {mercadoPagoEnabled && (
              <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-slate-200 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "MERCADO_PAGO"}
                    onChange={() => setPaymentMethod("MERCADO_PAGO")}
                  />
                  <span className="font-medium">Mercado Pago</span>
                </span>
                <span className="pl-7 text-sm text-slate-600">
                  Total estimado: {mpTotal} (+{settings.mercadoPagoMarkupPercent}% sobre transferencia)
                </span>
              </label>
            )}
          </div>
        </section>

        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

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
                {(line.unit * line.quantity).toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4">
          <span className="text-slate-600">Total</span>
          <span className="text-xl font-bold text-brand-dark">{totalDisplay}</span>
        </div>
        <Link href="/carrito" className="mt-4 block text-center text-sm text-brand-dark underline">
          Editar carrito
        </Link>
      </aside>
    </form>
  );
}
