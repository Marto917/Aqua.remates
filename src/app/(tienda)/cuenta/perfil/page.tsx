import { SignOutButton } from "@/components/SignOutButton";
import { CustomerShippingProfileForm } from "@/components/cuenta/CustomerShippingProfileForm";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { updateProfileImageAction, updateShippingProfileAction } from "./actions";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

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

  const avatar = resolveUserAvatarUrl(user.imageUrl);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-600">{user.email}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <span className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-brand/30 bg-brand-muted">
            <Image
              src={avatar}
              alt="Tu foto de perfil"
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized={avatar.startsWith("http")}
            />
          </span>
          <p className="text-lg font-semibold text-slate-900">{user.name}</p>
        </div>

        <form action={updateProfileImageAction} className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-slate-700" htmlFor="imageUrl">
            URL de tu foto (opcional)
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={user.imageUrl?.startsWith("http") ? user.imageUrl : ""}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Guardar foto
          </button>
        </form>

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
        <Link href="/cuenta/pedidos-mayorista" className="font-medium text-brand-dark underline">
          Pedidos mayorista
        </Link>
      </div>

      <SignOutButton
        callbackUrl="/"
        className="w-full rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      />
    </div>
  );
}
