import { CheckoutClient } from "./CheckoutClient";
import { isMercadoPagoConfigured } from "@/lib/mercadopago";

export default function CheckoutPage() {
  const mercadoPagoEnabled = isMercadoPagoConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Finalizar compra</h1>
        <p className="mt-1 text-sm text-slate-600">
          Elegí envío y pago. Los precios se calculan desde tu carrito minorista.
        </p>
      </div>
      <CheckoutClient mercadoPagoEnabled={mercadoPagoEnabled} />
    </div>
  );
}
