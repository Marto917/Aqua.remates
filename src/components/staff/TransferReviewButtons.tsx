"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveTransferOrder,
  rejectTransferOrder,
} from "@/app/(staff)/admin/pedidos/actions";
import { IconCheck, IconX } from "@/components/icons/StaffIcons";

type Props = {
  orderId: string;
};

export function TransferReviewButtons({ orderId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function run(action: "approve" | "reject") {
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", orderId);
      const result =
        action === "approve" ? await approveTransferOrder(fd) : await rejectTransferOrder(fd);

      if (!result.ok) {
        setFeedback({ type: "error", text: result.error });
        return;
      }

      setFeedback({
        type: "ok",
        text:
          action === "approve"
            ? "Pedido confirmado. Si configuraste Resend, el cliente recibió un email."
            : "Pedido cancelado.",
      });
      router.refresh();
    });
  }

  return (
    <div>
      {feedback ? (
        <p
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            feedback.type === "ok"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("approve")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          aria-label="Aceptar pago y confirmar pedido"
          title="Aceptar"
        >
          <IconCheck className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("reject")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          aria-label="Declinar pedido"
          title="Declinar"
        >
          <IconX className="h-5 w-5" />
        </button>
      </div>
      {pending ? <p className="mt-2 text-xs text-slate-500">Procesando…</p> : null}
    </div>
  );
}
