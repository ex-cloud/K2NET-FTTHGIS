/**
 * apps/studio-admin/src/proxy.ts
 *
 * Middleware for the Admin Portal (system-gis.kdua.net / system.lvh.me).
 *
 * Responsibilities:
 * 1. Detect `system` subdomain (or direct access to admin port)
 * 2. Enforce authentication (redirect to /login if unauthenticated)
 * 3. Device OTP verification gate
 * 4. No tenant routing logic — admin only handles /system/* internally
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$/);

  if (isStaticOrApi) {
    return NextResponse.next();
  }

  console.log(`[Admin Proxy] Incoming: ${pathname}`);

  // ── Auth Check ────────────────────────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: "k2net-gis.session-token",
    secureCookie: false,
  });
  const isLoggedIn = !!token;

  const isLoginPath = pathname === "/login";

  // Redirect unauthenticated users to /login
  if (!isLoggedIn && !isLoginPath) {
    console.log(`[Admin Proxy] Unauthenticated: ${pathname} → /login`);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from /login
  if (isLoggedIn && isLoginPath) {
    return NextResponse.redirect(new URL("/organizations", request.url));
  }

  // ── Device Verification Gate ──────────────────────────────────────────────
  if (isLoggedIn && !isLoginPath) {
    const fingerprint = request.cookies.get("device_fingerprint")?.value;
    const isDeviceVerified = fingerprint
      ? request.cookies.get(`device_verified_${fingerprint}`)?.value === "true"
      : false;

    if (!isDeviceVerified && pathname !== "/login/otp") {
      console.log(
        `[Admin Proxy] Device unverified → /login/otp (from ${pathname})`
      );
      return NextResponse.redirect(
        new URL(
          `/login/otp?callbackUrl=${encodeURIComponent(pathname + request.nextUrl.search)}`,
          request.url
        )
      );
    }
  }

  return NextResponse.next();
}

export { proxy as middleware };
export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
