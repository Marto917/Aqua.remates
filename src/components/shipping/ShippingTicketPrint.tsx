"use client";

import { useEffect, useState } from "react";
import type { ShippingTicketData } from "@/lib/shipping-ticket";
import { formatRiderNumber } from "@/lib/rider-number";
import { isHomeDelivery } from "@/lib/shipping";

type Props = {
  ticket: ShippingTicketData;
  qrPayloadJson: string;
};

export function ShippingTicketPrint({ ticket, qrPayloadJson }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const showAddress = isHomeDelivery(ticket.shippingMethod);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(qrPayloadJson, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 220,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
          setQrError(null);
        }
      } catch {
        if (!cancelled) {
          setQrError("No se pudo generar el código QR.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qrPayloadJson]);

  return (
    <div className="shipping-ticket-root mx-auto max-w-lg bg-white text-slate-900">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .shipping-ticket-root, .shipping-ticket-root * { visibility: visible; }
          .shipping-ticket-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            padding: 12mm;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Imprimir ticket
        </button>
        {ticket.orderType === "retail" ? (
          <a
            href={`/vendedor/envios/minorista/${ticket.orderId}/armar`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
          >
            Armar pedido
          </a>
        ) : null}
        <a
          href="/vendedor/envios"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
        >
          Volver a envíos
        </a>
      </div>

      <article className="rounded-lg border-2 border-slate-900 p-5">
        <header className="border-b-2 border-slate-900 pb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Aqua Remates</p>
          <h1 className="mt-1 text-xl font-bold">Ticket de envío</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pedido {ticket.orderType === "retail" ? "minorista" : "mayorista"} · {ticket.orderId}
          </p>
          <p className="text-xs text-slate-500">{ticket.createdAtLabel}</p>
        </header>

        <section className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Destinatario</p>
            <p className="text-lg font-bold">{ticket.buyerName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Teléfono</p>
              <p className="font-medium">{ticket.buyerPhone || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Código postal</p>
              <p className="font-medium">{ticket.postalCode || "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Modalidad</p>
            <p className="font-medium">{ticket.shippingMethodLabel}</p>
          </div>

          {ticket.assignedRiderNumber != null ? (
            <div className="rounded-md border border-violet-400 bg-violet-50 p-3">
              <p className="text-xs font-semibold uppercase text-violet-800">Repartidor asignado</p>
              <p className="mt-1 text-lg font-bold text-violet-950">
                {formatRiderNumber(ticket.assignedRiderNumber)}
                {ticket.assignedRiderName ? ` · ${ticket.assignedRiderName}` : ""}
              </p>
              <p className="mt-1 text-xs text-violet-700">
                El QR incluye este número; otro repartidor no puede tomar el viaje.
              </p>
            </div>
          ) : null}

          {showAddress ? (
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Dirección de entrega</p>
              <p className="mt-1 text-base font-semibold leading-snug">{ticket.fullAddress || "—"}</p>
            </div>
          ) : (
            <div className="rounded-md border border-violet-300 bg-violet-50 p-3">
              <p className="text-sm font-medium text-violet-900">Retiro en sucursal — sin envío a domicilio</p>
            </div>
          )}

          {ticket.customerComments ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase text-amber-800">Indicaciones del cliente</p>
              <p className="mt-1 font-medium text-amber-950">{ticket.customerComments}</p>
            </div>
          ) : null}

          <div className="flex justify-between border-t border-slate-200 pt-3 text-xs text-slate-600">
            <span>
              {ticket.itemCount} ítem{ticket.itemCount === 1 ? "" : "s"} · {ticket.statusLabel}
            </span>
            <span className="font-semibold text-slate-900">{ticket.totalLabel}</span>
          </div>
        </section>

        <footer className="mt-5 flex items-end justify-between gap-4 border-t-2 border-dashed border-slate-400 pt-4">
          <div className="text-xs text-slate-500">
            <p>Escanear para consulta logística</p>
            <p className="mt-1 font-mono text-[10px] break-all">{ticket.lookupApiPath}</p>
          </div>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR del pedido" width={120} height={120} className="shrink-0" />
          ) : (
            <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-[10px] text-slate-500">
              {qrError ?? "Generando QR…"}
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
