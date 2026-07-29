import {
  customerBanMessage,
  formatBanUntil,
} from "@/lib/customer-moderation";

type Props = {
  bannedUntil: Date | string | null;
  banReason: string | null;
  accountWarning: boolean;
};

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function CustomerAccountStatusBanner({ bannedUntil, banReason, accountWarning }: Props) {
  const until = toDate(bannedUntil);
  const banned = Boolean(until);

  if (banned && until) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
        <p className="font-semibold">Cuenta suspendida</p>
        <p className="mt-1">{customerBanMessage({ bannedUntil: until, banReason })}</p>
        <p className="mt-1 text-xs text-rose-800">
          No podés finalizar compras ni subir comprobantes hasta {formatBanUntil(until)}.
        </p>
      </div>
    );
  }

  if (accountWarning) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Aviso importante sobre tu cuenta</p>
        <p className="mt-1">
          Esta cuenta tuvo problemas anteriores (por ejemplo, comprobantes de transferencia
          rechazados o una suspensión temporal). Por favor, asegurate de enviar comprobantes
          correctos y del monto exacto en tus próximos pedidos.
        </p>
      </div>
    );
  }

  return null;
}
