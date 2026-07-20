import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { TransferProofUpload } from "@/components/checkout/TransferProofUpload";
import { canCustomerAccessOrder } from "@/lib/order-access";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function SubirComprobantePage({ params }: Props) {
  const session = await getSafeSession();
  if (!session?.user?.id) {
    const { orderId } = await params;
    redirect(`/login?callbackUrl=${encodeURIComponent(`/cuenta/mis-compras/${orderId}/comprobante`)}`);
  }
  if (session.user.role !== UserRole.CUSTOMER) {
    redirect("/");
  }

  const { orderId } = await params;
  const order = await prisma.retailOrder.findUnique({ where: { id: orderId } });
  if (!order || !canCustomerAccessOrder(order, session)) {
    notFound();
  }
  if (order.paymentMethod !== "BANK_TRANSFER") {
    redirect("/cuenta/mis-compras");
  }
  if (order.status === "CANCELLED" || order.status === "CONFIRMED" || order.status === "PAYMENT_APPROVED") {
    redirect("/cuenta/mis-compras");
  }
  if (order.status !== "PENDING_TRANSFER" && order.status !== "TRANSFER_REPORTED") {
    redirect("/cuenta/mis-compras");
  }

  const settings = await getStoreSettings();
  const transfer = {
    holder: settings.bankHolder,
    alias: order.transferAlias || settings.bankAlias,
    cbu: order.transferCbu || settings.bankCbu,
    notes: settings.bankExtraNotes,
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/cuenta/mis-compras" className="text-sm font-medium text-brand-dark underline">
        ← Volver a Mis compras
      </Link>
      <TransferProofUpload
        orderId={order.id}
        totalAmount={Number(order.totalAmount)}
        transfer={transfer}
      />
    </div>
  );
}
