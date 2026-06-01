import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AdminBannersManager } from "@/components/admin/AdminBannersManager";
import { AdminHeroPromoManager } from "@/components/admin/AdminHeroPromoManager";
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

  const [banners, heroPromo] = await Promise.all([
    prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getHeroPromoSettings(),
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
            Gestión visual del home: carrusel principal y bloque de promos.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-brand-dark underline">
          ← Volver al panel
        </Link>
      </div>
      <AdminHeroPromoManager initial={heroPromo} />
      <AdminBannersManager initialBanners={initialBanners} />
    </section>
  );
}
