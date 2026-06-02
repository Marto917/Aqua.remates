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
};

export function RiderAssignControls({
  orderId,
  riders,
  assignedRider,
  canDispatch,
  deliveryStatus,
}: Props) {
  if (riders.length === 0) {
    return (
      <p className="text-xs text-amber-800">
        No hay repartidores activos. El admin debe crear cuentas en Riders.
      </p>
    );
  }

  const riderSelect = (
    <select
      name="riderNumber"
      required
      defaultValue={assignedRider?.riderNumber ?? ""}
      className="max-w-[140px] rounded border border-slate-300 px-2 py-1 text-xs"
    >
      <option value="" disabled>
        Nº repartidor
      </option>
      {riders.map((r) => (
        <option key={r.riderNumber} value={r.riderNumber}>
          {formatRiderNumber(r.riderNumber)} {r.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-2">
      {assignedRider ? (
        <p className="text-xs font-medium text-violet-900">
          {formatRiderNumber(assignedRider.riderNumber)} {assignedRider.name}
        </p>
      ) : null}

      {deliveryStatus !== "DELIVERED" && deliveryStatus !== "DISPATCHED" ? (
        <form action={assignRiderFormAction} className="flex flex-wrap items-center gap-1">
          <input type="hidden" name="orderId" value={orderId} />
          {riderSelect}
          <button
            type="submit"
            className="rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100"
          >
            Asignar
          </button>
        </form>
      ) : null}

      {canDispatch ? (
        <form action={dispatchDeliveryFormAction} className="flex flex-wrap items-center gap-1">
          <input type="hidden" name="orderId" value={orderId} />
          {!assignedRider ? riderSelect : null}
          <button
            type="submit"
            className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
          >
            Emitir envío
          </button>
        </form>
      ) : null}
    </div>
  );
}
