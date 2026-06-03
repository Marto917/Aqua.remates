"use client";

import { useState } from "react";
import { assignRiderFormAction, dispatchDeliveryFormAction } from "@/app/(staff)/vendedor/envios/actions";
import { formatRiderNumber } from "@/lib/rider-number";

type RiderOption = {
  riderNumber: number;
  name: string;
};

type Props = {
  orderId: string;
  riders: RiderOption[];
  assignedRider: { riderNumber: number; name: string } | null;
  canDispatch: boolean;
  deliveryStatus: string | null;
  isPacked: boolean;
};

export function RiderAssignControls({
  orderId,
  riders,
  assignedRider,
  canDispatch,
  deliveryStatus,
  isPacked,
}: Props) {
  const [expanded, setExpanded] = useState(!assignedRider);

  if (riders.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
        Sin repartidores.{" "}
        <a href="/admin/riders" className="font-semibold underline">
          Crear en Riders
        </a>
      </div>
    );
  }

  const canAssign =
    deliveryStatus !== "DELIVERED" &&
    (!assignedRider || deliveryStatus !== "DISPATCHED");
  const showAssignPanel = canAssign && (expanded || !assignedRider);

  const riderSelect = (
    <select
      name="riderNumber"
      required
      defaultValue={assignedRider?.riderNumber ?? ""}
      className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs"
    >
      <option value="" disabled>
        Elegir repartidor…
      </option>
      {riders.map((r) => (
        <option key={r.riderNumber} value={r.riderNumber}>
          {formatRiderNumber(r.riderNumber)} · {r.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-w-[9rem] space-y-2">
      {assignedRider ? (
        <div className="rounded-lg bg-violet-50 px-2 py-1.5">
          <p className="text-[10px] font-medium uppercase text-violet-700">Asignado</p>
          <p className="text-xs font-semibold text-violet-950">
            {formatRiderNumber(assignedRider.riderNumber)} {assignedRider.name}
          </p>
        </div>
      ) : (
        <p className="text-xs font-medium text-rose-700">Sin repartidor</p>
      )}

      {showAssignPanel ? (
        <form action={assignRiderFormAction} className="space-y-1.5 rounded-lg border border-violet-100 bg-white p-2">
          <input type="hidden" name="orderId" value={orderId} />
          {riderSelect}
          <button
            type="submit"
            className="w-full rounded-full bg-violet-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            Asignar repartidor
          </button>
        </form>
      ) : assignedRider && canAssign ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] font-medium text-violet-700 underline"
        >
          Cambiar repartidor
        </button>
      ) : null}

      {canDispatch ? (
        <form action={dispatchDeliveryFormAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <button
            type="submit"
            disabled={!assignedRider}
            className="w-full rounded-full bg-sky-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={!assignedRider ? "Asigná un repartidor primero" : undefined}
          >
            Emitir envío
          </button>
        </form>
      ) : null}

      {!isPacked && deliveryStatus !== "DELIVERED" ? (
        <p className="text-[10px] text-amber-700">Armá el pedido antes de emitir.</p>
      ) : null}
    </div>
  );
}
