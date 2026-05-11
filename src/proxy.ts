import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // 1. Subdomain Detection
  const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
  
  // Extract root domain from env or fallback
  let rootDomain = "localhost:3000";
  if (isProduction) {
    rootDomain = "ftthgis.com";
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      rootDomain = new URL(process.env.NEXT_PUBLIC_APP_URL).host;
    } catch {
      rootDomain = process.env.NEXT_PUBLIC_APP_URL.replace("http://", "").replace("https://", "");
    }
  }
  
  let subdomain = "";
  if (hostname.includes(rootDomain)) {
    const extracted = hostname.replace(`.${rootDomain}`, "");
    if (extracted !== hostname && extracted !== "www" && extracted !== rootDomain) {
      subdomain = extracted;
    }
  }

  // 2. Direct Redirects for root paths on subdomains
  if (subdomain === "system") {
     if (pathname === "/" || pathname === "/system") {
       return NextResponse.redirect(new URL("/organizations", request.url));
     }
  } else if (subdomain && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Routing Logic (Rewriting)
  let effectivePathname = pathname;

  if (subdomain === "system") {
    // If the URL already contains /system/ (e.g. from a direct link), we let it be
    // but we prefer to rewrite clean URLs like /organizations to /system/organizations
    if (!pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/system") && !pathname.startsWith("/login")) {
      effectivePathname = `/system${pathname === "/" ? "" : pathname}`;
    } else if (pathname === "/login") {
      effectivePathname = "/system/login";
    }
  } else if (subdomain) {
    // Rewrite tenant routes to /org/[slug]/...
    if (!pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/login") && !pathname.startsWith("/org")) {
      effectivePathname = `/org/${subdomain}${pathname === "/" ? "" : pathname}`;
    }
  }

  // 4. Security Check (Lightweight)
  // We do a basic check here to handle /login vs /dashboard redirects early
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const isLoggedIn = !!token;

  // If logged in and hitting login page, redirect to home
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 5. Perform the Rewrite
  if (effectivePathname !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
