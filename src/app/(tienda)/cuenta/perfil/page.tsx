import { SignOutButton } from "@/components/SignOutButton";
import { CustomerProfileAvatarForm } from "@/components/cuenta/CustomerProfileAvatarForm";
import { CustomerAddressesManager } from "@/components/cuenta/CustomerAddressesManager";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { updatePhoneAction } from "./actions";
import { listCustomerAddresses } from "@/lib/customer-addresses";
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
    },
  });

  if (!user) {
    redirect("/login");
  }

  const addresses = await listCustomerAddresses(session.user.id);

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

        <CustomerAddressesManager
          phone={user.phone ?? ""}
          initialAddresses={addresses}
          updatePhoneAction={updatePhoneAction}
        />
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/cuenta/mis-compras" className="font-medium text-brand-dark underline">
          Mis compras
        </Link>
      </div>

      <SignOutButton
        callbackUrl="/"
        className="w-full rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      />
    </div>
  );
}
