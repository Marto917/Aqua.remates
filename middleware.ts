import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { isBackofficePreview } from "./src/lib/backoffice-preview";
import { getStaffLoginPath, isStaffLoginPath } from "./src/lib/staff-login-path";

const OWNER_ONLY_PATHS = ["/admin/finanzas", "/admin/aprobaciones", "/admin/riders"];
const USER_MANAGEMENT_PATHS = ["/admin/usuarios"];
const ROLES = {
  OWNER: "OWNER",
  EMPLOYEE: "EMPLOYEE",
  CUSTOMER: "CUSTOMER",
} as const;

function isStaffArea(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vendedor") ||
    isStaffLoginPath(pathname)
  );
}

function nextWithHeaders(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const pathname = req.nextUrl.pathname;
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-layout-area", isStaffArea(pathname) ? "staff" : "store");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function staffAccessLevel(token: Record<string, unknown> | null): string {
  return String(token?.staffAccessLevel ?? "");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;
  const host = req.headers.get("host")?.split(",")[0]?.trim().toLowerCase() ?? "";

  // Apex → www: evita que Google OAuth y las cookies fallen por dominio distinto.
  if (host === "aquaremates.com.ar") {
    const url = req.nextUrl.clone();
    url.host = "www.aquaremates.com.ar";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (isStaffArea(pathname)) {
    const preview = isBackofficePreview();
    if (preview) {
      return nextWithHeaders(req);
    }

    // Login staff: sin token (si no, redirect loop / página inaccesible).
    if (isStaffLoginPath(pathname)) {
      return nextWithHeaders(req);
    }

    const token = await getToken({ req, secret });
    const staffLoginPath = getStaffLoginPath();
    if (!token) {
      const loginUrl = new URL(staffLoginPath, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const staffRole = String((token as { role?: unknown }).role ?? "");

    if (staffRole !== ROLES.OWNER && staffRole !== ROLES.EMPLOYEE) {
      return NextResponse.redirect(new URL("/catalog", req.url));
    }

    if (OWNER_ONLY_PATHS.some((path) => pathname.startsWith(path)) && staffRole !== ROLES.OWNER) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (
      USER_MANAGEMENT_PATHS.some((path) => pathname.startsWith(path)) &&
      staffRole !== ROLES.OWNER &&
      staffAccessLevel(token as Record<string, unknown>) !== "MANAGER"
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return nextWithHeaders(req);
  }

  if (pathname.startsWith("/checkout")) {
    const token = await getToken({ req, secret });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const roleStr = String((token as { role?: unknown }).role ?? "");
    const emailOk = Boolean((token as { emailVerified?: boolean }).emailVerified);
    if (roleStr === "CUSTOMER" && !emailOk) {
      return NextResponse.redirect(new URL("/cuenta/verificar-email", req.url));
    }
  }

  return nextWithHeaders(req);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/vendedor",
    "/vendedor/:path*",
    "/checkout",
    "/checkout/:path*",
    // Incluye /api/auth para que apex→www también aplique al callback de Google.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|webp|jpg|jpeg|gif|ico)$).*)",
  ],
};
