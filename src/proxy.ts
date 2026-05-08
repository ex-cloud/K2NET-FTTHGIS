import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/system/login", "/api/auth", "/"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/auth"),
  );

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // 1. System Admin Area Logic
  const isSystemRoute = pathname.startsWith("/system");
  const isSystemLogin = pathname === "/system/login";

  if (isSystemRoute) {
    if (isSystemLogin) {
      if (isLoggedIn) return NextResponse.redirect(new URL("/system/organizations", request.url));
      return NextResponse.next();
    }
    if (!isLoggedIn) {
      const loginUrl = new URL("/system/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Tenant/User Area Logic
  const protectedRoutes = ["/dashboard", "/org"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // If not logged in and trying to access protected route, redirect to login
  if (!isLoggedIn && isProtectedRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access tenant login page, redirect to /org
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/org", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
