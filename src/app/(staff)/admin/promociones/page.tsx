import { UserRole } from "@prisma/client";
import { StaffBackLink } from "@/components/staff/StaffBackLink";
import { AdminBannersManager } from "@/components/admin/AdminBannersManager";
import { AdminCatalogPromoManager } from "@/components/admin/AdminCatalogPromoManager";
import { AdminFreeShippingManager } from "@/components/admin/AdminFreeShippingManager";
import { AdminHeroPromoManager } from "@/components/admin/AdminHeroPromoManager";
import { getCatalogPromoSettings } from "@/lib/catalog-promo";
import { getFreeShippingSettings } from "@/lib/free-shipping";
import { getHeroPromoSettings } from "@/lib/hero-promo";
import { placementFromSortOrder } from "@/lib/banner-placement";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export default async function AdminPromocionesPage() {
  const session = await getSafeSession();
  const canManage =
    isBackofficePreview() ||
    session?.user.role === UserRole.OWNER ||
    session?.user.role === UserRole.EMPLOYEE;

  if (!canManage) {
    return (
      <section className="rounded-xl border bg-white p-5 text-sm text-slate-700">
        No autorizado.
      </section>
    );
  }

  const [banners, heroPromo, catalogPromo, freeShipping, categories] = await Promise.all([
    prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getHeroPromoSettings(),
    getCatalogPromoSettings(),
    getFreeShippingSettings(),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const initialBanners = banners.map((b) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl,
    isActive: b.isActive,
    sortOrder: b.sortOrder,
    placement: placementFromSortOrder(b.sortOrder),
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Promociones e imágenes</h1>
          <p className="text-sm text-slate-600">
            Banners, promos de catálogo, envío gratis y tarifas de envío por zona.
          </p>
        </div>
        <StaffBackLink href="/admin" label="Panel" />
      </div>
      <AdminCatalogPromoManager initial={catalogPromo} categories={categories} />
      <AdminFreeShippingManager initial={freeShipping} categories={categories} />
      <AdminHeroPromoManager initial={heroPromo} />
      <AdminBannersManager initialBanners={initialBanners} />
    </section>
  );
}
