"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveTransferOrder,
  banCustomerFromOrder,
  rejectTransferOrder,
} from "@/app/(staff)/admin/pedidos/actions";
import { IconCheck, IconX } from "@/components/icons/StaffIcons";
import { BAN_DURATION_OPTIONS } from "@/lib/ban-duration-options";

type Props = {
  orderId: string;
  hasCustomer: boolean;
  rejectCount: number;
  accountWarning: boolean;
  bannedUntil: string | null;
};

export function TransferReviewButtons({
  orderId,
  hasCustomer,
  rejectCount,
  accountWarning,
  bannedUntil,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [banDays, setBanDays] = useState(0);
  const [showRejectExtras, setShowRejectExtras] = useState(false);

  function runApprove() {
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", orderId);
      const result = await approveTransferOrder(fd);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error });
        return;
      }
      setFeedback({
        type: "ok",
        text: "Pedido confirmado. Si configuraste el mail, el cliente recibió aviso.",
      });
      router.refresh();
    });
  }

  function runReject() {
    setFeedback(null);
    const confirmMsg =
      banDays > 0
        ? `¿Declinar el comprobante y suspender la cuenta ${banDays} día(s)?`
        : "¿Declinar este comprobante y cancelar el pedido?";
    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", orderId);
      if (banDays > 0) fd.set("banDays", String(banDays));
      fd.set(
        "banReason",
        "Comprobante de transferencia rechazado de forma reiterada.",
      );
      const result = await rejectTransferOrder(fd);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error });
        return;
      }
      setFeedback({ type: "ok", text: result.message ?? "Pedido cancelado." });
      setShowRejectExtras(false);
      setBanDays(0);
      router.refresh();
    });
  }

  function runBanOnly() {
    if (!hasCustomer || banDays < 1) return;
    if (!window.confirm(`¿Suspender esta cuenta por ${banDays} día(s)?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", orderId);
      fd.set("banDays", String(banDays));
      fd.set("banReason", "Suspensión manual por abuso de comprobantes.");
      const result = await banCustomerFromOrder(fd);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error });
        return;
      }
      setFeedback({ type: "ok", text: result.message ?? "Cuenta suspendida." });
      router.refresh();
    });
  }

  const currentlyBanned = Boolean(bannedUntil);

  return (
    <div className="space-y-3">
      {feedback ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            feedback.type === "ok"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      {hasCustomer ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <p>
            Comprobantes rechazados: <strong>{rejectCount}</strong>
            {accountWarning ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                Historial con problemas
              </span>
            ) : null}
          </p>
          {currentlyBanned && bannedUntil ? (
            <p className="mt-1 font-medium text-rose-700">
              Cuenta suspendida hasta{" "}
              {new Date(bannedUntil).toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          ) : null}
          {rejectCount >= 2 && !currentlyBanned ? (
            <p className="mt-1 text-amber-800">
              Este cliente ya tuvo rechazos previos. Considerá suspender la cuenta al declinar.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={runApprove}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          aria-label="Aceptar pago y confirmar pedido"
          title="Aceptar"
        >
          <IconCheck className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowRejectExtras((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          aria-label="Declinar pedido"
          title="Declinar"
        >
          <IconX className="h-5 w-5" />
        </button>
      </div>

      {showRejectExtras ? (
        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/60 p-3">
          <p className="text-sm font-medium text-rose-900">Declinar comprobante</p>
          {hasCustomer ? (
            <label className="block text-xs text-slate-700">
              Suspender cuenta (opcional)
              <select
                value={banDays}
                onChange={(e) => setBanDays(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value={0}>Solo cancelar pedido (sin ban)</option>
                {BAN_DURATION_OPTIONS.map((opt) => (
                  <option key={opt.days} value={opt.days}>
                    Cancelar y banear {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-xs text-slate-600">
              Este pedido no tiene cuenta vinculada; solo se cancelará el pedido.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={runReject}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Confirmar declinación
            </button>
            {hasCustomer && !currentlyBanned ? (
              <button
                type="button"
                disabled={pending || banDays < 1}
                onClick={runBanOnly}
                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-50"
              >
                Solo suspender cuenta
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowRejectExtras(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {pending ? <p className="text-xs text-slate-500">Procesando…</p> : null}
    </div>
  );
}
