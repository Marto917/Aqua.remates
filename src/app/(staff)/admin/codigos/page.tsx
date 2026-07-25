import { UserRole } from "@prisma/client";
import { StaffBackLink } from "@/components/staff/StaffBackLink";
import { AdminPromoCodesManager } from "@/components/admin/AdminPromoCodesManager";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export default async function AdminCodigosPage() {
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

  const [codes, categories, products] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, categoryId: true },
      take: 500,
    }),
  ]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Códigos</h1>
          <p className="text-sm text-slate-600">
            Códigos de regalo y descuento para clientes (ej. AQUA = 5% en una categoría).
          </p>
        </div>
        <StaffBackLink href="/admin" label="Panel" />
      </div>
      <AdminPromoCodesManager
        initial={codes.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          description: c.description,
          rewardType: c.rewardType,
          rewardValue: Number(c.rewardValue),
          scopeType: c.scopeType,
          categoryIds: c.categoryIds,
          productIds: c.productIds,
          isActive: c.isActive,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
        }))}
        categories={categories}
        products={products}
      />
    </section>
  );
}
