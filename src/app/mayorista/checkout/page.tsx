import { UserRole } from "@prisma/client";
import { WholesaleCheckoutClient } from "./WholesaleCheckoutClient";
import { getSafeSession } from "@/lib/get-session";

export default async function MayoristaCheckoutPage() {
  const session = await getSafeSession();
  const isCustomer = session?.user?.role === UserRole.CUSTOMER;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Pedido mayorista</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enviá tu carrito para que un vendedor confirme stock, precios y forma de entrega.
        </p>
      </div>
      <WholesaleCheckoutClient
        loggedIn={Boolean(session?.user?.id && isCustomer)}
        emailVerified={Boolean(session?.user?.emailVerified)}
        defaultName={session?.user?.name ?? ""}
        defaultEmail={session?.user?.email ?? ""}
      />
    </div>
  );
}
