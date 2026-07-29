import { redirect } from "next/navigation";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { canManageUsers, getStaffContext } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const ctx = await getStaffContext();
  if (!canManageUsers(ctx)) {
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
      transferProofRejectCount: true,
      accountWarning: true,
      bannedUntil: true,
      banReason: true,
    },
  });
  return (
    <section className="mx-auto max-w-6xl space-y-4 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Usuarios y permisos</h1>
        <p className="text-sm text-slate-600">
          Crear, editar y eliminar cuentas de clientes y personal (encargado y vendedor).
        </p>
      </div>
      <AdminUsersManager initialUsers={users} />
    </section>
  );
}
