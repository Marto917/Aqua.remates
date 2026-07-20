"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatArs } from "@/lib/currency";

type Props = {
  orderId: string;
  totalAmount: number;
  transfer: {
    holder: string;
    alias: string;
    cbu: string;
    notes?: string | null;
  };
};

export function TransferProofUpload({ orderId, totalAmount, transfer }: Props) {
  const router = useRouter();
  const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
  const UPLOAD_TIMEOUT_MS = 90_000;
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onFileChange(f: File | null) {
    setFile(f);
    setError(null);
    if (f) {
      if (f.size > MAX_UPLOAD_BYTES) {
        setFile(null);
        setError("El archivo supera 12 MB. Elegí uno más liviano.");
        return;
      }
      const ok =
        f.type === "application/pdf" ||
        f.type.startsWith("image/");
      if (!ok) {
        setFile(null);
        setError("Formato no admitido. Usá PDF, JPG o PNG.");
      }
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Elegí el comprobante de transferencia.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("proofFile", file);
      const res = await fetch(`/api/retail-orders/${orderId}/transfer-proof`, {
        method: "POST",
        body: fd,
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      });
      const raw = await res.text();
      let data: { error?: string; ok?: boolean } = {};
      try {
        data = raw ? (JSON.parse(raw) as { error?: string; ok?: boolean }) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        if (res.status === 413) {
          setError("El archivo es demasiado pesado. Probá con uno más liviano.");
          return;
        }
        setError(data.error ?? "No se pudo subir el comprobante.");
        return;
      }
      setDone(true);
      router.push("/cuenta/mis-compras");
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "TimeoutError"
          ? "La subida tardó demasiado. Probá con una foto más liviana o en JPG."
          : e instanceof Error && e.message
            ? e.message
            : "Error de conexión. Intentá de nuevo.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <h2 className="text-lg font-semibold">Pedido registrado</h2>
        <p className="mt-2 text-sm">
          Número: <span className="font-mono text-xs">{orderId}</span>
        </p>
        <p className="mt-2 text-sm">
          Si cerrás esta página, podés volver a subir el comprobante desde{" "}
          <Link href="/cuenta/mis-compras" className="font-semibold underline">
            Mis compras
          </Link>
          .
        </p>
      </div>

      <aside className="rounded-xl border-2 border-brand/30 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Transferí el monto exacto</h3>
        <p className="mt-2 text-3xl font-bold text-brand-dark">{formatArs(totalAmount)}</p>
        <p className="mt-1 text-xs text-rose-700">
          El importe debe coincidir exactamente con el total del pedido.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <strong>Titular:</strong> {transfer.holder}
          </li>
          <li>
            <strong>Alias:</strong> {transfer.alias}
          </li>
          <li>
            <strong>CBU:</strong> {transfer.cbu}
          </li>
          {transfer.notes ? <li className="text-slate-600">{transfer.notes}</li> : null}
        </ul>
      </aside>

      {done ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-semibold">Comprobante enviado</p>
          <p className="mt-1">
            Un vendedor va a revisar el pago y confirmar tu pedido para el envío.
          </p>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-slate-900">Subir comprobante</h3>
          <p className="mt-1 text-sm text-slate-600">
            Adjuntá el comprobante de transferencia por {formatArs(totalAmount)} (PDF o imagen).
          </p>
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 hover:border-brand/40">
            <span className="text-3xl text-slate-400" aria-hidden>
              📄
            </span>
            <span className="text-sm font-medium text-brand-dark">
              {file ? file.name : "Elegir archivo (PDF, JPG, PNG)"}
            </span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !file}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            aria-label="Enviar comprobante"
          >
            {submitting ? "Enviando…" : "Enviar comprobante"}
          </button>
        </form>
      )}
    </div>
  );
}
