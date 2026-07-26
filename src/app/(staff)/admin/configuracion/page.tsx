import { AdminBrandSettingsForm } from "@/components/admin/AdminBrandSettingsForm";
import { AdminFooterImageForm } from "@/components/admin/AdminFooterImageForm";
import { AdminStoreSettingsForm } from "@/components/admin/AdminStoreSettingsForm";
import { getStaffContext, isOwnerAccess } from "@/lib/staff-auth";
import { getStoreSettings, ensureStoreSettings } from "@/lib/store-settings";
import { prisma } from "@/lib/prisma";

export default async function AdminConfiguracionPage() {
  await ensureStoreSettings();
  const settings = await getStoreSettings();
  const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  const ctx = await getStaffContext();
  // Solo el dueño puede editar alias / CVU / datos bancarios
  const canEditBank = isOwnerAccess(ctx);

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración de la tienda</h1>
        <p className="text-sm text-slate-600">
          Datos bancarios, colores, pie de página y textos de la tienda pública.
        </p>
      </div>
      <AdminBrandSettingsForm
        logoUrl={settings.brandLogoUrl}
        contact={{
          storePhone: settings.storePhone,
          storeInstagram: settings.storeInstagram,
          storeTiktok: settings.storeTiktok,
          storeAddress: settings.storeAddress,
        }}
      />
      <AdminStoreSettingsForm initial={settings} canEditBank={canEditBank} />
      <AdminFooterImageForm currentUrl={row?.footerImageUrl ?? null} />
    </section>
  );
}
