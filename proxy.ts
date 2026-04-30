import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_PREFIXES = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  ADMIN: "/admin",
} as const;

type Role = keyof typeof ROLE_PREFIXES;

function roleDashboard(role: string, base: string) {
  const prefix = ROLE_PREFIXES[role as Role] ?? "/student";
  return new URL(`${prefix}/dashboard`, base);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request as any,
    secret: process.env.AUTH_SECRET,
  });

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (token) {
    const role = token.role as string;
    const status = token.status as string;

    if (pathname === "/" || isAuthPage) {
      return NextResponse.redirect(roleDashboard(role, request.url));
    }

    if (status === "INACTIVE") {
      return NextResponse.redirect(new URL("/login?error=inactive", request.url));
    }

    const expectedPrefix = ROLE_PREFIXES[role as Role] ?? "/student";
    if (
      !pathname.startsWith("/api/") &&
      !pathname.startsWith(expectedPrefix) &&
      !pathname.startsWith("/courses")
    ) {
      return NextResponse.redirect(roleDashboard(role, request.url));
    }

    return NextResponse.next();
  }

  // Unauthenticated
  const isPublic =
    pathname === "/" ||
    isAuthPage ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/courses");

  if (isPublic) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

