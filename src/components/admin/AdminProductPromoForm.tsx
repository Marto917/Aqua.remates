import { IconPencil } from "@/components/icons/StaffIcons";

type Props = {
  productId: string;
  showPromoBadge: boolean;
  promoBadgePercent: number | null;
  promoPrice: number | null;
  retailPrice: number;
};

export function AdminProductPromoForm({
  productId,
  showPromoBadge,
  promoBadgePercent,
  promoPrice,
  retailPrice,
}: Props) {
  return (
    <form
      method="post"
      action={`/api/admin/products/${productId}`}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="intent" value="update_promo" />
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
        <IconPencil className="h-4 w-4 text-brand-dark" aria-hidden />
        <span>Promoción en tienda</span>
      </h2>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="showPromoBadge" defaultChecked={showPromoBadge} />
        Mostrar badge de descuento en catálogo
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-700">
          % en el círculo (ej. 20)
          <input
            name="promoBadgePercent"
            type="number"
            min={1}
            max={99}
            defaultValue={promoBadgePercent ?? ""}
            placeholder="20"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-700">
          Precio promo transferencia
          <input
            name="promoPrice"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={promoPrice ?? ""}
            placeholder={`Normal: ${retailPrice}`}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Si activás el badge y ponés precio promo, en la tienda se tacha el precio normal y se muestra el nuevo.
        Desactivá el checkbox para ocultar el círculo de descuento.
      </p>
      <button
        type="submit"
        className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Guardar promo
      </button>
    </form>
  );
}
