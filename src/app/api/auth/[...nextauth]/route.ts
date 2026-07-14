import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { syncNextAuthUrlFromRequest } from "@/lib/app-url";

/** Una sola instancia: recrear el handler por request rompe el state/CSRF de OAuth. */
const nextAuthHandler = NextAuth(authOptions);

type RouteContext = { params: Promise<{ nextauth: string[] }> };

/**
 * Next.js 15 pasa `params` como Promise; NextAuth v4 los espera ya resueltos.
 * Sin await, el callback de Google falla con error=OAuthCallback.
 */
async function handleAuth(req: NextRequest, context: RouteContext) {
  syncNextAuthUrlFromRequest(req);
  const params = await context.params;
  return nextAuthHandler(req, { params } as { params: { nextauth: string[] } });
}

export { handleAuth as GET, handleAuth as POST };
