import { SignOutButton } from "@/components/SignOutButton";
import { CustomerProfileAvatarForm } from "@/components/cuenta/CustomerProfileAvatarForm";
import { CustomerShippingProfileForm } from "@/components/cuenta/CustomerShippingProfileForm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { updateShippingProfileAction } from "./actions";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PerfilPage({ searchParams }: PageProps) {
  const session = await getSafeSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/cuenta/perfil");
  }
  if (session.user.role !== UserRole.CUSTOMER) {
    redirect("/");
  }

  const sp = await searchParams;
  const phoneError = sp.error === "phone";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      imageUrl: true,
      phone: true,
      defaultShippingAddress: true,
      defaultShippingCity: true,
      defaultShippingProvince: true,
      defaultShippingPostalCode: true,
      defaultShippingNotes: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-600">{user.email}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <CustomerProfileAvatarForm initialImageUrl={user.imageUrl} userName={user.name} />

        {phoneError ? (
          <p className="mt-3 text-sm text-rose-600">El teléfono debe tener al menos 8 caracteres.</p>
        ) : null}

        <CustomerShippingProfileForm
          action={updateShippingProfileAction}
          initial={{
            phone: user.phone ?? "",
            shippingAddress: user.defaultShippingAddress ?? "",
            shippingCity: user.defaultShippingCity ?? "",
            shippingProvince: user.defaultShippingProvince ?? "",
            shippingPostalCode: user.defaultShippingPostalCode ?? "",
            shippingNotes: user.defaultShippingNotes ?? "",
          }}
        />
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/cuenta/mis-compras" className="font-medium text-brand-dark underline">
          Mis compras
        </Link>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500"
        >
          Próximamente: mayorista
        </button>
      </div>

      <SignOutButton
        callbackUrl="/"
        className="w-full rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      />
    </div>
  );
}
