import { getDynamicAuthConfig } from "@/auth";
import NextAuth from "next-auth";
import { NextRequest } from "next/server";

/**
 * Rewrite the internal request URL (http://localhost:3000/...) to the
 * public-facing URL (https://system-gis.kdua.net/... or https://tenant-gis.kdua.net/...)
 * using the X-Forwarded-Host and X-Forwarded-Proto headers set by Nginx.
 *
 * This is critical for multi-subdomain setups where AUTH_URL cannot be set
 * to a single static value. Without this, NextAuth generates redirect_uri
 * as http://localhost:3000/api/auth/callback/keycloak which Keycloak rejects.
 */
const withCorrectUrl = (req: NextRequest): NextRequest => {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    const { href, origin } = req.nextUrl;
    const newOrigin = `${forwardedProto}://${forwardedHost}`;
    const newUrl = href.replace(origin, newOrigin);
    console.log(`[NextAuth Route] Rewriting URL: ${origin} -> ${newOrigin}`);
    return new NextRequest(newUrl, req);
  }

  return req;
};

export const GET = (req: NextRequest) => {
  const correctedReq = withCorrectUrl(req);
  const host = correctedReq.headers.get("x-forwarded-host") || correctedReq.headers.get("host") || "";
  const dynamicConfig = getDynamicAuthConfig(host);
  const { handlers } = NextAuth(dynamicConfig);
  return handlers.GET(correctedReq);
};

export const POST = (req: NextRequest) => {
  const correctedReq = withCorrectUrl(req);
  const host = correctedReq.headers.get("x-forwarded-host") || correctedReq.headers.get("host") || "";
  const dynamicConfig = getDynamicAuthConfig(host);
  const { handlers } = NextAuth(dynamicConfig);
  return handlers.POST(correctedReq);
};


