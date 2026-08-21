/**
 * @k2net/auth — Shared Auth Utilities
 *
 * Pure utility functions used by both studio-admin and studio-tenant portals.
 * No Next.js-specific imports here — safe to call from server or edge contexts.
 */
import { createHash } from "crypto";

// ─────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────

export function logInfo(msg: string) {
  console.log(`[Auth] ${new Date().toISOString()}: ${msg}`);
}

// ─────────────────────────────────────────────
// Cookie Domain
// ─────────────────────────────────────────────

/**
 * Returns the shared cookie domain for the K2NET platform.
 * - Production: `.k2net.id` (shared across all subdomains)
 * - Localhost/IP: undefined (host-only cookies)
 */
export function getCookieDomain(): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return undefined;
  try {
    const hostname = new URL(appUrl).hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ) {
      return undefined;
    }
    // Shared cookie domain for system-gis.kdua.net, *.gis.kdua.net, and legacy k2net.id
    if (hostname === "kdua.net" || hostname.endsWith(".kdua.net")) {
      return ".kdua.net";
    }
    if (hostname === "k2net.id" || hostname.endsWith(".k2net.id")) {
      return ".k2net.id";
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────

/**
 * Generates a Gravatar URL from an email address.
 * Falls back to identicon (geometric pattern) if no Gravatar exists.
 */
export function generateGravatar(email: string | null | undefined): string | null {
  if (!email) return null;
  const hash = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}

// ─────────────────────────────────────────────
// Realm Detection
// ─────────────────────────────────────────────

/**
 * Extracts the Keycloak realm name from the request host header.
 * 
 * Examples:
 * - `system-gis.k2net.id` → `ftth-realm` (system admin = default realm)
 * - `kircon-gis.k2net.id` → `kircon`
 * - `localhost:3000`       → `ftth-realm`
 */
export function getRealmFromHost(host: string): string {
  if (!host) return "ftth-realm";

  // Clean port if present
  const cleanHost = host.split(":")[0];

  // Localhost / IP → default realm
  if (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost.match(/^\d+\.\d+\.\d+\.\d+$/)
  ) {
    return "ftth-realm";
  }

  const subdomain = cleanHost.split(".")[0];
  if (!subdomain || subdomain.startsWith("system")) {
    return "ftth-realm";
  }

  // Strip `-gis` suffix (e.g. kircon-gis → kircon)
  let realm = subdomain;
  if (subdomain.endsWith("-gis")) {
    realm = subdomain.substring(0, subdomain.length - 4);
  }

  // Sanitize: allow only alphanumeric and hyphens
  return realm.replace(/[^a-zA-Z0-9-]/g, "");
}

// ─────────────────────────────────────────────
// Token Refresh
// ─────────────────────────────────────────────

/**
 * Refreshes the Keycloak access token using the stored refresh token.
 * Routes server-side requests through the internal Keycloak URL to bypass Cloudflare.
 */
export async function refreshAccessToken(token: {
  issuer?: string;
  email?: string | null;
  refreshToken?: string;
  expiresAt?: number;
  [key: string]: unknown;
}) {
  try {
    const issuer =
      (token.issuer as string) || process.env.AUTH_KEYCLOAK_ISSUER || "";

    logInfo(`Refreshing token for user ${token.email} using issuer: ${issuer}`);

    const rawServerUrl =
      process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "https://auth-gis.kdua.net";
    const serverUrl = rawServerUrl.endsWith("/")
      ? rawServerUrl.slice(0, -1)
      : rawServerUrl;

    let keycloakHost = "auth-gis.kdua.net";
    let keycloakProto = "https";
    try {
      const parsedUrl = new URL(serverUrl);
      keycloakHost = parsedUrl.host;
      keycloakProto = parsedUrl.protocol.replace(":", "");
    } catch (e) {
      console.error("[refreshAccessToken] Failed to parse server URL:", e);
    }

    const keycloakInternalUrl =
      process.env.AUTH_KEYCLOAK_INTERNAL_URL || "http://localhost:8081";

    const internalIssuer = issuer
      .replace(serverUrl, keycloakInternalUrl)
      .replace(`${serverUrl}:8081`, keycloakInternalUrl);

    const response = await fetch(
      `${internalIssuer}/protocol/openid-connect/token`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Forwarded-Host": keycloakHost,
          "X-Forwarded-Proto": keycloakProto,
        },
        body: new URLSearchParams({
          client_id: process.env.AUTH_KEYCLOAK_ID!,
          client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        }),
        method: "POST",
      }
    );

    const tokens = await response.json();

    if (!response.ok) {
      console.error("Keycloak Refresh Error Response:", tokens);
      throw tokens;
    }

    return {
      ...token,
      accessToken: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      idToken: tokens.id_token ?? token.idToken,
    };
  } catch (error) {
    console.error("Error refreshing Access Token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError" as const,
    };
  }
}
