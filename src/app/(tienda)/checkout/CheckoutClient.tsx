"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useStoreSettings } from "@/contexts/store-settings-context";
import {
  buildShippingAddressLine,
  isValidStreetNumber,
  shippingAddressHasStreetNumber,
} from "@/lib/address-validation";
import { formatDisplayWords } from "@/lib/display-text";
import { retailShippingMethodLabel } from "@/lib/order-labels";
import { AddressFields } from "@/components/checkout/AddressFields";
import { TransferProofUpload } from "@/components/checkout/TransferProofUpload";
import type { ShippingQuote } from "@/lib/shipping-quote";
import { getListPrice, getTransferPrice } from "@/lib/store-pricing";

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
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingStreetNumber, setShippingStreetNumber] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [useOtherAddress, setUseOtherAddress] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferDone, setTransferDone] = useState<{
    orderId: string;
    transfer: TransferInfo;
    totalAmount: number;
  } | null>(null);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);

  const lineSummaries = useMemo(() => {
    return lines.map((line) => {
      const product = {
        listPrice: line.listPrice,
        categoryId: line.categoryId,
      };
      const transferUnit = getTransferPrice(product, settings.catalogPromo);
      const mpUnit = getListPrice(product);
      const unit = paymentMethod === "BANK_TRANSFER" ? transferUnit : mpUnit;
      return {
        ...line,
        transferUnit,
        mpUnit,
        unit,
        lineTotal: unit * line.quantity,
      };
    });
  }, [lines, paymentMethod, settings.catalogPromo]);

  const subtotalAmount = useMemo(
    () => lineSummaries.reduce((a, l) => a + l.lineTotal, 0),
    [lineSummaries],
  );

  const totalDisplay = useMemo(() => {
    const total =
      shippingMethod === "DELIVERY" && shippingQuote && !shippingQuote.error
        ? shippingQuote.totalAmount
        : subtotalAmount;
    return total.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  }, [shippingMethod, shippingQuote, subtotalAmount]);

  const subtotalDisplay = useMemo(
    () => subtotalAmount.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
    [subtotalAmount],
  );

  const mpSubtotal = useMemo(
    () => lineSummaries.reduce((a, l) => a + l.mpUnit * l.quantity, 0),
    [lineSummaries],
  );

  const mpTotal = useMemo(() => {
    const shipping =
      shippingMethod === "DELIVERY" && shippingQuote && !shippingQuote.error
        ? shippingQuote.shippingAmount
        : 0;
    return (mpSubtotal + shipping).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  }, [mpSubtotal, shippingMethod, shippingQuote]);

  useEffect(() => {
    if (paymentMethod === "MERCADO_PAGO" && !mercadoPagoEnabled) {
      setPaymentMethod("BANK_TRANSFER");
    }
  }, [mercadoPagoEnabled, paymentMethod]);

  useEffect(() => {
    if (shippingMethod !== "DELIVERY" || lines.length === 0) {
      setShippingQuote(null);
      return;
    }
    if (!shippingPostalCode.trim()) {
      setShippingQuote(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setShippingQuoteLoading(true);
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod,
            shippingMethod,
            shippingPostalCode: shippingPostalCode.trim(),
            shippingProvince: shippingProvince.trim() || undefined,
            lines: lines.map((l) => ({
              variantId: l.variantId,
              productId: l.productId,
              quantity: l.quantity,
            })),
          }),
        });
        const data = (await res.json()) as { quote?: ShippingQuote; error?: string };
        if (cancelled) return;
        if (data.quote) {
          setShippingQuote(data.quote);
        } else {
          setShippingQuote(null);
        }
      } catch {
        if (!cancelled) setShippingQuote(null);
      } finally {
        if (!cancelled) setShippingQuoteLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    shippingMethod,
    shippingPostalCode,
    shippingProvince,
    paymentMethod,
    lines,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/shipping-profile");
        const data = (await res.json()) as {
          profile?: {
            name?: string;
            email?: string;
            phone?: string | null;
            shippingAddress?: string | null;
            shippingCity?: string | null;
            shippingProvince?: string | null;
            shippingPostalCode?: string | null;
            shippingNotes?: string | null;
          } | null;
        };
        if (cancelled || !data.profile) return;
        const p = data.profile;
        if (!buyerName && p.name) setBuyerName(p.name);
        if (!buyerEmail && p.email) setBuyerEmail(p.email);
        if (!buyerPhone && p.phone) setBuyerPhone(p.phone);
        const saved =
          Boolean(p.shippingAddress?.trim()) &&
          Boolean(p.shippingCity?.trim()) &&
          Boolean(p.shippingProvince?.trim()) &&
          Boolean(p.shippingPostalCode?.trim());
        setHasSavedAddress(saved);
        if (saved) {
          const full = (p.shippingAddress ?? "").trim();
          const match = full.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
          if (match) {
            setShippingStreet(match[1]);
            setShippingStreetNumber(match[2]);
          } else {
            setShippingStreet(full);
            setShippingStreetNumber("");
          }
          setShippingCity(p.shippingCity ?? "");
          setShippingProvince(p.shippingProvince ?? "");
          setShippingPostalCode(p.shippingPostalCode ?? "");
          setShippingNotes(p.shippingNotes ?? "");
        }
      } catch {
        /* sin sesión */
      }
    })();
    return () => {
      cancelled = true;
    };
    // Solo al montar: precargar perfil una vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="space-y-4">
        <TransferProofUpload
          orderId={transferDone.orderId}
          totalAmount={transferDone.totalAmount}
          transfer={transferDone.transfer}
        />
        <Link href="/catalog" className="inline-block text-sm font-medium text-brand-dark underline">
          Seguir comprando
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (shippingMethod === "DELIVERY") {
      if (!shippingStreet.trim()) {
        setError("Indicá la calle de entrega.");
        return;
      }
      if (!isValidStreetNumber(shippingStreetNumber)) {
        setError("El número de casa es obligatorio (solo números, ej: 1234).");
        return;
      }
      const addressLine = buildShippingAddressLine(shippingStreet, shippingStreetNumber);
      if (!shippingAddressHasStreetNumber(addressLine)) {
        setError("La dirección debe incluir calle y número.");
        return;
      }
      if (!shippingCity.trim() || !shippingProvince.trim() || !shippingPostalCode.trim()) {
        setError("Completá ciudad, provincia y código postal para el envío.");
        return;
      }
      if (!shippingQuote || shippingQuote.error) {
        setError(shippingQuote?.error ?? "No pudimos calcular el costo de envío. Revisá el código postal.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/retail-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone.trim(),
          notes: notes || undefined,
          paymentMethod,
          shippingMethod,
          shippingAddress:
            shippingMethod === "DELIVERY"
              ? buildShippingAddressLine(shippingStreet, shippingStreetNumber)
              : undefined,
          shippingCity: shippingMethod === "DELIVERY" ? shippingCity : undefined,
          shippingProvince: shippingMethod === "DELIVERY" ? shippingProvince : undefined,
          shippingPostalCode: shippingMethod === "DELIVERY" ? shippingPostalCode : undefined,
          shippingNotes: shippingMethod === "DELIVERY" ? shippingNotes : undefined,
          saveToProfile: shippingMethod === "DELIVERY" ? saveToProfile : false,
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
        totalAmount?: number;
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
      const total =
        typeof data.totalAmount === "number"
          ? data.totalAmount
          : lineSummaries.reduce((a, l) => a + l.lineTotal, 0);
      setTransferDone({
        orderId: data.orderId ?? "",
        totalAmount: total,
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
              required
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="Teléfono / WhatsApp"
              minLength={8}
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
              {hasSavedAddress && !useOtherAddress ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">Dirección guardada en tu perfil</p>
                  <p className="mt-1">
                    {buildShippingAddressLine(shippingStreet, shippingStreetNumber)}, {shippingCity} (
                    {shippingProvince}) — CP {shippingPostalCode}
                  </p>
                  {shippingNotes ? <p className="mt-1 text-xs text-slate-500">{shippingNotes}</p> : null}
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-brand-dark underline"
                    onClick={() => setUseOtherAddress(true)}
                  >
                    Enviar a otra dirección
                  </button>
                </div>
              ) : (
                <>
                  {hasSavedAddress ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-brand-dark underline"
                      onClick={() => setUseOtherAddress(false)}
                    >
                      Usar dirección guardada
                    </button>
                  ) : null}
                  <AddressFields
                    street={shippingStreet}
                    streetNumber={shippingStreetNumber}
                    city={shippingCity}
                    province={shippingProvince}
                    postalCode={shippingPostalCode}
                    notes={shippingNotes}
                    onStreetChange={setShippingStreet}
                    onStreetNumberChange={setShippingStreetNumber}
                    onCityChange={setShippingCity}
                    onProvinceChange={setShippingProvince}
                    onPostalCodeChange={setShippingPostalCode}
                    onNotesChange={setShippingNotes}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                    />
                    Guardar esta dirección en mi perfil
                  </label>
                  <p className="text-xs text-slate-500">
                    También podés editar tus datos en{" "}
                    <Link href="/cuenta/perfil" className="text-brand-dark underline">
                      Mi perfil
                    </Link>
                    .
                  </p>
                </>
              )}
              {shippingPostalCode.trim() ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {shippingQuoteLoading ? (
                    <p>Calculando envío…</p>
                  ) : shippingQuote?.error ? (
                    <p className="text-amber-800">{shippingQuote.error}</p>
                  ) : shippingQuote ? (
                    <>
                      <p>
                        Zona: <strong>{shippingQuote.zoneLabel}</strong>
                      </p>
                      <p className="mt-1">
                        Envío:{" "}
                        {shippingQuote.freeShipping ? (
                          <span className="font-semibold text-emerald-700">
                            Gratis
                            {shippingQuote.freeShippingReason
                              ? ` (${shippingQuote.freeShippingReason})`
                              : ""}
                          </span>
                        ) : (
                          <strong>
                            {shippingQuote.shippingAmount.toLocaleString("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            })}
                          </strong>
                        )}
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
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
              <span className="pl-7 text-sm text-brand-dark">Total: {subtotalTransfer}</span>
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
                <span className="pl-7 text-sm text-slate-600">Total: {mpTotal} (precio de lista)</span>
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
        <div className="mt-4 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal productos</span>
            <span>{subtotalDisplay}</span>
          </div>
          {shippingMethod === "DELIVERY" && shippingQuote && !shippingQuote.error ? (
            <div className="flex justify-between text-slate-600">
              <span>Envío ({shippingQuote.zoneLabel})</span>
              <span>
                {shippingQuote.freeShipping
                  ? "Gratis"
                  : shippingQuote.shippingAmount.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between pt-1">
            <span className="font-medium text-slate-800">Total</span>
            <span className="text-xl font-bold text-brand-dark">{totalDisplay}</span>
          </div>
        </div>
        <Link href="/carrito" className="mt-4 block text-center text-sm text-brand-dark underline">
          Editar carrito
        </Link>
      </aside>
    </form>
  );
}
