import { redirect } from "next/navigation";
import { CarritoClient } from "@/app/(tienda)/carrito/CarritoClient";
import { getSafeSession } from "@/lib/get-session";

export default async function CarritoPage() {
  const session = await getSafeSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fcarrito");
  }
  return <CarritoClient />;
}
