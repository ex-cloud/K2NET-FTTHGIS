import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // 0. Subdomain Detection
  const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
  const rootDomain = isProduction ? "ftthgis.com" : "localhost:3000";

  let subdomain = null;
  if (hostname.includes(rootDomain)) {
    const extracted = hostname.replace(`.${rootDomain}`, "");
    if (extracted !== hostname && extracted !== "www") {
      subdomain = extracted; // 'system' is now captured here as well
    }
  }

  // 1. Calculate Effective Pathname
  // This allows auth checks to run on the 'internal' path even if accessed via a clean subdomain URL.
  let effectivePathname = pathname;
  
  // Direct Redirects for root paths on subdomains
  if (subdomain === "system" && pathname === "/") {
    return NextResponse.redirect(new URL("/organizations", request.url));
  } else if (subdomain && subdomain !== "system" && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (subdomain === "system") {
    // Exclude static and api routes from getting prefixed
    if (!pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/system")) {
      effectivePathname = `/system${pathname === "/" ? "" : pathname}`;
    }
  } else if (subdomain) {
    if (!pathname.startsWith("/api") && !pathname.startsWith("/login") && !pathname.startsWith("/_next") && !pathname.startsWith(`/org/${subdomain}`)) {
      effectivePathname = `/org/${subdomain}${pathname === "/" ? "" : pathname}`;
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/system/login", "/api/auth"];
  if (!subdomain) {
    publicRoutes.push("/"); // Root domain landing page is public
  }

  const isPublicRoute = publicRoutes.some(
    (route) => effectivePathname === route || effectivePathname.startsWith("/api/auth"),
  );

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // 2. System Admin Area Logic
  const isSystemRoute = effectivePathname.startsWith("/system");
  const isSystemLogin = effectivePathname === "/system/login";

  if (isSystemRoute) {
    if (isSystemLogin) {
      if (isLoggedIn) return NextResponse.redirect(new URL(subdomain === "system" ? "/organizations" : "/system/organizations", request.url));
      // Let it pass (will rewrite later if needed)
    } else if (!isLoggedIn && !isPublicRoute) {
      const loginUrl = new URL(subdomain === "system" ? "/login" : "/system/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Tenant/User Area Logic (Only run if not system)
  if (!isSystemRoute) {
    const protectedRoutes = ["/dashboard", "/org"];
    const isProtectedRoute = !!subdomain || protectedRoutes.some((route) =>
      effectivePathname.startsWith(route),
    );

    // If not logged in and trying to access protected route, redirect to login
    if (!isLoggedIn && isProtectedRoute && !isPublicRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If logged in and trying to access tenant login page, redirect to home (or /org if no subdomain)
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL(subdomain ? "/" : "/org", request.url));
    }
  }

  // 4. Perform the Rewrite if Effective Path changed
  if (effectivePathname !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
