import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncNextAuthUrlFromRequest } from "@/lib/app-url";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

async function handleAuth(req: Request, context: RouteContext) {
  syncNextAuthUrlFromRequest(req);
  const handler = NextAuth(authOptions);
  return handler(req, context);
}

export { handleAuth as GET, handleAuth as POST };
