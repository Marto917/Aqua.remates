import { AdminCategoriesManager } from "@/components/admin/AdminCategoriesManager";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <section className="mx-auto max-w-xl space-y-4 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Categorías</h1>
        <p className="text-sm text-slate-600">Agregar o eliminar categorías del catálogo.</p>
      </div>
      <AdminCategoriesManager initial={categories} />
    </section>
  );
}
