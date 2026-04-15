import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Sesión segura: en producción un NEXTAUTH_SECRET mal configurado puede hacer fallar todo el layout. */
export async function getSafeSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("[auth] getServerSession:", error);
    return null;
  }
}
