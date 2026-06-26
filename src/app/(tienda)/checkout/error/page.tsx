import Link from "next/link";
import { RetryMercadoPagoButton } from "@/components/checkout/RetryMercadoPagoButton";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ external_reference?: string }>;
};

export default async function CheckoutErrorPage({ searchParams }: PageProps) {
  const { external_reference: orderIdRaw } = await searchParams;
  const orderId = orderIdRaw?.trim();

  let canRetry = false;
  if (orderId) {
    const order = await prisma.retailOrder.findUnique({
      where: { id: orderId },
      select: { status: true, paymentMethod: true },
    });
    canRetry =
      Boolean(order) &&
      order.paymentMethod === "MERCADO_PAGO" &&
      order.status === "PENDING_PAYMENT";
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
      <h1 className="text-2xl font-bold text-rose-900">No se completó el pago</h1>
      <p className="mt-3 text-sm text-rose-800">
        {canRetry
          ? "Tu pedido sigue guardado. El carrito también se mantiene. Podés reintentar el pago sin volver a cargar los productos."
          : "El pago fue cancelado o rechazado. Podés volver al carrito e intentar de nuevo."}
      </p>

      {canRetry && orderId ? <RetryMercadoPagoButton orderId={orderId} /> : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/carrito" className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white">
          Ir al carrito
        </Link>
        {canRetry ? null : (
          <Link href="/checkout" className="text-sm font-medium text-brand-dark underline">
            Reintentar checkout
          </Link>
        )}
      </div>
    </div>
  );
}
