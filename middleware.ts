import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
// Import relativo: en algunos entornos el alias @/ falla al empaquetar el middleware (Edge).
import { isBackofficePreview } from "./src/lib/backoffice-preview";
import { getStaffLoginPath } from "./src/lib/staff-login-path";

const OWNER_ONLY_PATHS = ["/admin/finanzas", "/admin/aprobaciones", "/admin/riders", "/admin/usuarios"];
const ROLES = {
  OWNER: "OWNER",
  EMPLOYEE: "EMPLOYEE",
  CUSTOMER: "CUSTOMER",
} as const;

function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;

  const preview = isBackofficePreview();
  if (preview && (pathname.startsWith("/admin") || pathname.startsWith("/vendedor"))) {
    return nextWithPathname(req);
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
    return nextWithPathname(req);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/vendedor")) {
    const token = await getToken({ req, secret });
    const staffLoginPath = getStaffLoginPath();
    if (!token) {
      const loginUrl = new URL(staffLoginPath, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const staffRole = String((token as { role?: unknown }).role ?? "");

    if (OWNER_ONLY_PATHS.some((path) => pathname.startsWith(path)) && staffRole !== ROLES.OWNER) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (staffRole !== ROLES.OWNER && staffRole !== ROLES.EMPLOYEE) {
      return NextResponse.redirect(new URL("/catalog", req.url));
    }

    return nextWithPathname(req);
  }

  return nextWithPathname(req);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendedor/:path*",
    "/checkout/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|webp|jpg|jpeg|gif|ico)$).*)",
  ],
};
