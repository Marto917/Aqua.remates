import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminRidersManager } from "@/components/admin/AdminRidersManager";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export default async function AdminRidersPage() {
  const session = await getSafeSession();
  if (session?.user.role !== UserRole.OWNER) {
    redirect("/admin");
  }

  const riders = await prisma.rider.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      riderNumber: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  const initialRiders = riders.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Repartidores (riders)</h1>
        <p className="text-sm text-slate-600">
          Cuentas para la app de mapas. Solo el admin principal puede crearlas o desactivarlas.
        </p>
      </div>
      <AdminRidersManager initialRiders={initialRiders} />
    </section>
  );
}
