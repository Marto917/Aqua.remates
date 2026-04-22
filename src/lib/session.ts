import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Sesión NextAuth (staff y clientes). Usado por acciones legacy que aún no migraron a `getSafeSession`. */
export async function getCurrentSession() {
  return getServerSession(authOptions);
}
