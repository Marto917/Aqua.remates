import { StaffProfileForm } from "@/components/admin/StaffProfileForm";
import { requireStaff } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

export default async function StaffProfilePage() {
  const ctx = await requireStaff();
  const userId = ctx.session?.user?.id;
  if (!userId) {
    return <p className="text-sm text-slate-600">Iniciá sesión como empleado.</p>;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, imageUrl: true, email: true },
  });

  if (!user) {
    return <p className="text-sm text-slate-600">Usuario no encontrado.</p>;
  }

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-600">
          Personalizá cómo te ven tus compañeros en el panel ({user.email}).
        </p>
      </div>
      <StaffProfileForm initialName={user.name} initialImageUrl={user.imageUrl} />
    </section>
  );
}
