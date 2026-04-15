import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_PREFIXES = {
  STUDENT: "/student",
  TEACHER: "/teacher",
  ADMIN: "/admin",
} as const;

type Role = keyof typeof ROLE_PREFIXES;

function roleDashboard(role: string, base: string) {
  const prefix = ROLE_PREFIXES[(role as Role)] ?? "/student";
  return new URL(`${prefix}/dashboard`, base);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Authenticated users: redirect away from "/" and auth pages
  if (session) {
    if (pathname === "/" || isAuthPage) {
      return NextResponse.redirect(roleDashboard(session.user.role, req.url));
    }
    // INACTIVE — force back to login
    if (session.user.status === "INACTIVE") {
      return NextResponse.redirect(new URL("/login?error=inactive", req.url));
    }
    // Role-path mismatch
    const expectedPrefix = ROLE_PREFIXES[session.user.role as Role] ?? "/student";
    if (
      !pathname.startsWith(expectedPrefix) &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/courses")
    ) {
      return NextResponse.redirect(roleDashboard(session.user.role, req.url));
    }
    return NextResponse.next();
  }

  // Unauthenticated: allow public paths
  const isPublic =
    pathname === "/" ||
    isAuthPage ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/courses");

  if (isPublic) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", req.url));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
