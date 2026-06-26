import Link from "next/link";
import { ClearCartOnPaymentSuccess } from "@/components/checkout/ClearCartOnPaymentSuccess";
import { RetryMercadoPagoButton } from "@/components/checkout/RetryMercadoPagoButton";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    external_reference?: string;
    status?: string;
    collection_status?: string;
  }>;
};

function mpReturnStatus(params: {
  status?: string;
  collection_status?: string;
}): string | null {
  return params.status ?? params.collection_status ?? null;
}

export default async function CheckoutExitoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = params.external_reference?.trim();
  const returnStatus = mpReturnStatus(params);

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold text-amber-900">Pago en proceso</h1>
        <p className="mt-3 text-sm text-amber-800">
          Si acabás de pagar, Mercado Pago puede tardar unos segundos en confirmarlo. Revisá tu email
          cuando el pago quede acreditado.
        </p>
        <Link
          href="/cuenta/mis-compras"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white"
        >
          Ver mis compras
        </Link>
      </div>
    );
  }

  const order = await prisma.retailOrder.findUnique({
    where: { id: orderId },
    select: { status: true, paymentMethod: true },
  });

  const paidInDb =
    order && (order.status === "PAYMENT_APPROVED" || order.status === "CONFIRMED");

  const returnLooksApproved = returnStatus === "approved";

  if (!order || order.paymentMethod !== "MERCADO_PAGO") {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Pedido no encontrado</h1>
        <p className="mt-3 text-sm text-slate-600">No pudimos vincular este pago con un pedido.</p>
        <Link href="/catalog" className="mt-6 inline-block text-sm font-medium text-brand underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!paidInDb && !returnLooksApproved) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold text-amber-900">Pago no confirmado</h1>
        <p className="mt-3 text-sm text-amber-800">
          El pago no se completó. Tu pedido y el carrito siguen guardados.
        </p>
        <RetryMercadoPagoButton orderId={orderId} />
        <Link
          href="/carrito"
          className="mt-4 inline-block text-sm font-medium text-brand-dark underline"
        >
          Volver al carrito
        </Link>
      </div>
    );
  }

  if (!paidInDb && returnLooksApproved) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-sky-200 bg-sky-50 p-8 text-center">
        <h1 className="text-xl font-bold text-sky-900">Estamos confirmando tu pago</h1>
        <p className="mt-3 text-sm text-sky-800">
          Mercado Pago informó el pago, pero aún no lo registramos en el sistema. En unos segundos
          deberías recibir el mail de confirmación. Si no llega, revisá{" "}
          <Link href="/cuenta/mis-compras" className="font-semibold underline">
            mis compras
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <>
      <ClearCartOnPaymentSuccess active={Boolean(paidInDb)} />
      <div className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h1 className="text-2xl font-bold text-emerald-900">¡Pago confirmado!</h1>
        <p className="mt-3 text-sm text-emerald-800">
          Tu pago con Mercado Pago fue acreditado. Te enviamos un email con el detalle y coordinamos el
          envío o retiro según lo elegiste.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white"
        >
          Seguir comprando
        </Link>
      </div>
    </>
  );
}
