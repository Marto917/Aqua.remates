import { CheckoutClient } from "./CheckoutClient";
import { CustomerAccountStatusBanner } from "@/components/account/CustomerAccountStatusBanner";
import { getCustomerModeration } from "@/lib/customer-moderation";
import { getSafeSession } from "@/lib/get-session";
import { isMercadoPagoConfigured, isMercadoPagoSandbox } from "@/lib/mercadopago";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export default async function CheckoutPage() {
  const mercadoPagoEnabled = isMercadoPagoConfigured();
  const mercadoPagoSandbox = isMercadoPagoSandbox();
  const turnstileSiteKey = getTurnstileSiteKey();
  const session = await getSafeSession();
  const moderation = session?.user?.id
    ? await getCustomerModeration(session.user.id)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Finalizar compra</h1>
        <p className="mt-1 text-sm text-slate-600">
          Elegí envío y pago. Los precios se calculan desde tu carrito minorista.
        </p>
      </div>
      {moderation ? (
        <CustomerAccountStatusBanner
          bannedUntil={moderation.bannedUntil}
          banReason={moderation.banReason}
          accountWarning={moderation.accountWarning}
        />
      ) : null}
      <CheckoutClient
        mercadoPagoEnabled={mercadoPagoEnabled}
        mercadoPagoSandbox={mercadoPagoSandbox}
        turnstileSiteKey={turnstileSiteKey}
      />
    </div>
  );
}
