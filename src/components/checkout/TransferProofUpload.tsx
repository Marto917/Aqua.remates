"use client";

import Image from "next/image";
import { useState } from "react";
import { IconCamera } from "@/components/icons/StaffIcons";
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onFileChange(f: File | null) {
    setFile(f);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Elegí una foto o captura del comprobante.");
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
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir el comprobante.");
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
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
            Foto o captura del comprobante de transferencia por {formatArs(totalAmount)}.
          </p>
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 hover:border-brand/40">
            <IconCamera className="h-8 w-8 text-slate-400" />
            <span className="text-sm font-medium text-brand-dark">Elegir imagen</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {preview ? (
            <div className="relative mt-3 aspect-[4/3] max-h-64 overflow-hidden rounded-lg border">
              <Image src={preview} alt="Vista previa comprobante" fill className="object-contain" unoptimized />
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !file}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            aria-label="Enviar comprobante"
          >
            <IconCamera className="h-5 w-5" />
            {submitting ? "Enviando…" : "Enviar comprobante"}
          </button>
        </form>
      )}
    </div>
  );
}
