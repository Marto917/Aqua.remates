import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const EMPLOYEE_PATHS = ["/admin", "/admin/productos"];
const OWNER_ONLY_PATHS = ["/admin/finanzas"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (![...EMPLOYEE_PATHS, ...OWNER_ONLY_PATHS].some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (OWNER_ONLY_PATHS.some((path) => pathname.startsWith(path)) && token.role !== UserRole.OWNER) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (!Object.values(UserRole).includes(token.role as UserRole)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
