import { revalidatePath } from "next/cache";

/** Invalida caché de páginas que muestran el estado de entrega tras confirmar desde RodMaps. */
export function revalidatePathsAfterRiderDelivery(orderId: string) {
  revalidatePath("/vendedor/envios");
  revalidatePath("/vendedor/envios/repartidores");
  revalidatePath(`/vendedor/envios/minorista/${orderId}/armar`);
  revalidatePath(`/vendedor/envios/minorista/${orderId}/ticket`);
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/cuenta/mis-compras");
}
