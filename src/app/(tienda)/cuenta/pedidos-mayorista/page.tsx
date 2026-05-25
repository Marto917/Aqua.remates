import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { formatArs } from "@/lib/currency";
import { wholesaleRequestStatusLabel } from "@/lib/order-labels";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export default async function MisPedidosMayoristaPage() {
  const session = await getSafeSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/cuenta/pedidos-mayorista");
  }
  if (session.user.role !== UserRole.CUSTOMER) {
    redirect("/");
  }

  const orders = await prisma.wholesaleRequest.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Mis pedidos mayorista</h1>
        <p className="mt-1 text-sm text-slate-600">
          Estado de las solicitudes que enviaste desde el carrito. Un vendedor las confirma antes de preparar el envío.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
          Todavía no enviaste pedidos mayoristas.{" "}
          <Link href="/catalog" className="font-medium text-brand underline">
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const total = order.items.reduce((a, it) => a + Number(it.subtotal), 0);
            return (
              <li key={order.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.companyName}</p>
                    <p className="text-xs text-slate-500">
                      {order.createdAt.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                    {wholesaleRequestStatusLabel[order.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {order.items.length} producto{order.items.length === 1 ? "" : "s"} · Total estimado{" "}
                  <strong>{formatArs(total)}</strong>
                </p>
                {order.vendorNote && (order.status === "CONFIRMADO" || order.status === "RECHAZADO") ? (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium">Mensaje del vendedor: </span>
                    {order.vendorNote}
                  </p>
                ) : null}
                {order.status === "PENDIENTE_CONFIRMACION" ? (
                  <p className="mt-2 text-xs text-amber-800">Esperando confirmación del equipo comercial.</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/cuenta/mis-compras" className="mr-4 inline-block text-sm font-medium text-brand-dark underline">
        Mis compras minorista
      </Link>
      <Link href="/mayorista/checkout" className="inline-block text-sm font-medium text-brand-dark underline">
        Nuevo pedido mayorista
      </Link>
    </div>
  );
}
