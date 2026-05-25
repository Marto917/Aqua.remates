import { AdminStoreSettingsForm } from "@/components/admin/AdminStoreSettingsForm";
import { getStoreSettings, ensureStoreSettings } from "@/lib/store-settings";

export default async function AdminConfiguracionPage() {
  await ensureStoreSettings();
  const settings = await getStoreSettings();

  return (
    <section className="mx-auto max-w-2xl space-y-4 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración de la tienda</h1>
        <p className="text-sm text-slate-600">
          Datos bancarios para transferencias, recargo de Mercado Pago y texto del badge de descuento.
        </p>
      </div>
      <AdminStoreSettingsForm initial={settings} />
    </section>
  );
}
