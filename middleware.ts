import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const EMPLOYEE_PATHS = ["/admin", "/admin/productos"];
const OWNER_ONLY_PATHS = ["/admin/finanzas"];
const ROLES = {
  OWNER: "OWNER",
  EMPLOYEE: "EMPLOYEE",
  CUSTOMER: "CUSTOMER",
} as const;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;

  if (pathname.startsWith("/checkout")) {
    const token = await getToken({ req, secret });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Forzar string: si no, TS infiere UserRole y puede excluir CUSTOMER en el build de Vercel.
    const roleStr = String((token as { role?: unknown }).role ?? "");
    const emailOk = Boolean(
      (token as { emailVerified?: boolean }).emailVerified,
    );
    if (roleStr === "CUSTOMER" && !emailOk) {
      return NextResponse.redirect(new URL("/cuenta/verificar-email", req.url));
    }
    return NextResponse.next();
  }

  if (![...EMPLOYEE_PATHS, ...OWNER_ONLY_PATHS].some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const staffRole = String((token as { role?: unknown }).role ?? "");

  if (OWNER_ONLY_PATHS.some((path) => pathname.startsWith(path)) && staffRole !== ROLES.OWNER) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (staffRole !== ROLES.OWNER && staffRole !== ROLES.EMPLOYEE) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*"],
};
