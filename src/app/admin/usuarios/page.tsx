import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await getSafeSession();
  if (session?.user.role !== UserRole.OWNER) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      staffAccessLevel: true,
    },
  });

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Usuarios y permisos</h1>
        <p className="text-sm text-slate-600">
          Solo el admin principal puede crear cuentas y asignar permiso de encargado o vendedor.
        </p>
      </div>
      <AdminUsersManager initialUsers={users} />
    </section>
  );
}
