import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  
  if (!pathname.startsWith("/_next") && !pathname.startsWith("/favicon.ico") && !pathname.startsWith("/api")) {
    console.log(`[Proxy Middleware] Incoming Host: ${hostname}, Path: ${pathname}`);
  }

  // 1. Subdomain Detection
  // Extract root domain from NEXT_PUBLIC_APP_URL or hostname
  let rootDomain = "localhost:3000";
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      rootDomain = url.host; // e.g. system-gis.k2net.id or system.gis.k2net.id
    } catch {
      rootDomain = process.env.NEXT_PUBLIC_APP_URL.replace("http://", "").replace("https://", "");
    }
  }

  // Strip system. or system- prefix to get the base domain
  let baseDomain = rootDomain;
  let isHyphen = false;
  if (rootDomain.startsWith("system-")) {
    baseDomain = rootDomain.substring(7);
    isHyphen = true;
  } else if (rootDomain.startsWith("system.")) {
    baseDomain = rootDomain.substring(7);
  }

  let subdomain = "";
  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    subdomain = "";
  } else if (isHyphen && hostname.endsWith(`-${baseDomain}`)) {
    subdomain = hostname.substring(0, hostname.length - baseDomain.length - 1);
  } else if (!isHyphen && hostname.endsWith(`.${baseDomain}`)) {
    subdomain = hostname.substring(0, hostname.length - baseDomain.length - 1);
  } else if (hostname.includes(".lvh.me") || hostname.includes(".localhost")) {
    // Local development fallback
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const sub = parts[0];
      if (sub !== "www" && sub !== "system") {
        subdomain = sub;
      }
    }
  }

  // 2. Direct Redirects for root paths on subdomains
  if (subdomain === "system") {
     // 1. Enforce clean URLs (no /system prefix in browser)
     if (pathname.startsWith("/system")) {
       const cleanPath = pathname.replace("/system", "") || "/";
       // Special case: if it was just /system, redirect to /organizations (system home)
       const targetPath = (cleanPath === "/" || cleanPath === "") ? "/organizations" : cleanPath;
       return NextResponse.redirect(new URL(targetPath, request.url));
     }

     if (pathname === "/") {
       return NextResponse.redirect(new URL("/organizations", request.url));
     }
  } else if (subdomain) {
     // 2. Enforce clean URLs for tenants (no /org/[slug] prefix in browser)
     if (pathname.startsWith(`/org/${subdomain}`)) {
       const cleanPath = pathname.replace(`/org/${subdomain}`, "") || "/";
       const targetPath = (cleanPath === "/" || cleanPath === "") ? "/dashboard" : cleanPath;
       return NextResponse.redirect(new URL(targetPath, request.url));
     }

     if (pathname === "/") {
       return NextResponse.redirect(new URL("/dashboard", request.url));
     }
  }

  // 3. Routing Logic (Rewriting)
  let effectivePathname = pathname;

  if (subdomain === "system") {
    // If accessing tenant routes on system subdomain, rewrite to /org/system/...
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/project") || pathname.startsWith("/team")) {
      effectivePathname = `/org/system${pathname}`;
    } else if (!pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/system") && !pathname.startsWith("/login") && !pathname.startsWith("/account") && !pathname.startsWith("/org/")) {
      effectivePathname = `/system${pathname === "/" ? "" : pathname}`;
    } else if (pathname === "/login") {
      effectivePathname = "/system/login";
    }
  } else if (subdomain) {
    // Rewrite tenant routes to /org/[slug]/...
    if (!pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/login") && !pathname.startsWith("/org/") && !pathname.startsWith("/account")) {
      effectivePathname = `/org/${subdomain}${pathname === "/" ? "" : pathname}`;
    }
  }

  // 4. Security Check (Lightweight)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: "next-auth.session-token",
    secureCookie: false, // Must be false since cookieName in auth.ts is hardcoded to "next-auth.session-token" without __Secure- prefix
  });
  const isLoggedIn = !!token;

  // Protect paths: define public static or API assets
  const isStaticOrApi = pathname.startsWith("/_next") || 
                        pathname.startsWith("/favicon.ico") || 
                        pathname.startsWith("/api") ||
                        pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$/);

  if (!isStaticOrApi) {
    // Check device verification status
    const fingerprint = request.cookies.get("device_fingerprint")?.value;
    const isDeviceVerified = fingerprint ? request.cookies.get(`device_verified_${fingerprint}`)?.value === "true" : false;

    if (isLoggedIn && !isDeviceVerified && pathname !== "/login/otp") {
      console.log(`[Proxy Middleware] Logged in but device unverified. Redirecting to /login/otp`);
      return NextResponse.redirect(new URL(`/login/otp?callbackUrl=${encodeURIComponent(pathname + request.nextUrl.search)}`, request.url));
    }
    if (subdomain === "system") {
      const isLoginPath = pathname === "/login" || pathname === "/system/login";
      if (!isLoggedIn && !isLoginPath) {
        console.log(`[Proxy Middleware] Unauthenticated access to system: ${pathname}. Redirecting to /login`);
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (isLoggedIn && isLoginPath) {
        return NextResponse.redirect(new URL("/organizations", request.url));
      }
    } else if (subdomain) {
      // Tenant Subdomain
      const isLoginPath = pathname === "/login";
      if (!isLoggedIn && !isLoginPath) {
        console.log(`[Proxy Middleware] Unauthenticated access to tenant ${subdomain}: ${pathname}. Redirecting to /login`);
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (isLoggedIn && isLoginPath) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } else {
      // Root Domain
      const isProtectedRootPath = pathname.startsWith("/org") || pathname.startsWith("/dashboard");
      const isLoginPath = pathname === "/login";
      if (isProtectedRootPath && !isLoggedIn) {
        console.log(`[Proxy Middleware] Unauthenticated access to root protected path: ${pathname}. Redirecting to /login`);
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (isLoggedIn && (isLoginPath || pathname === "/")) {
        return NextResponse.redirect(new URL("/org", request.url));
      }
    }
  }

  // 5. Perform the Rewrite
  if (effectivePathname !== pathname) {
    console.log(`[Proxy Middleware] Rewriting: ${pathname} -> ${effectivePathname}`);
    const url = request.nextUrl.clone();
    url.pathname = effectivePathname;
    return NextResponse.rewrite(url);
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
