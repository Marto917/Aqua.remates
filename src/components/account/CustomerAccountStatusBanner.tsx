import {
  customerBanMessage,
  formatBanUntil,
  isCustomerCurrentlyBanned,
  shouldShowAccountWarning,
} from "@/lib/customer-moderation";

type Props = {
  bannedUntil: Date | null;
  banReason: string | null;
  accountWarning: boolean;
};

export function CustomerAccountStatusBanner({ bannedUntil, banReason, accountWarning }: Props) {
  const banned = isCustomerCurrentlyBanned({ bannedUntil });

  if (banned && bannedUntil) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
        <p className="font-semibold">Cuenta suspendida</p>
        <p className="mt-1">
          {customerBanMessage({ bannedUntil, banReason })}
        </p>
        <p className="mt-1 text-xs text-rose-800">
          No podés finalizar compras ni subir comprobantes hasta {formatBanUntil(bannedUntil)}.
        </p>
      </div>
    );
  }

  if (shouldShowAccountWarning({ bannedUntil, accountWarning })) {
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
