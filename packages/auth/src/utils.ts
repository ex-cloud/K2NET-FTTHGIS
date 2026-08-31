/**
 * @k2net/auth — Shared Auth Utilities
 *
 * Pure utility functions used by both studio-admin and studio-tenant portals.
 * No Next.js-specific imports here — safe to call from server or edge contexts.
 */
/**
 * Pure JS MD5 implementation for universal browser/Node compatibility
 */
function md5(str: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function binlMD5(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }
  function rstr2binl(input: string): number[] {
    const output: number[] = [];
    output[(input.length >> 2) - 1] = 0;
    for (let i = 0; i < output.length; i++) output[i] = 0;
    const length8 = input.length * 8;
    for (let i = 0; i < length8; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
    }
    return output;
  }
  function binl2rstr(input: number[]): string {
    let output = "";
    const length32 = input.length * 32;
    for (let i = 0; i < length32; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
    }
    return output;
  }
  function rstr2hex(input: string): string {
    const hexTab = "0123456789abcdef";
    let output = "";
    for (let i = 0; i < input.length; i++) {
      const x = input.charCodeAt(i);
      output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
    }
    return output;
  }
  return rstr2hex(binl2rstr(binlMD5(rstr2binl(unescape(encodeURIComponent(str))), unescape(encodeURIComponent(str)).length * 8)));
}

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
 * - Production: `.kdua.net` (shared across all subdomains)
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
    // Shared cookie domain for system-gis.kdua.net and *.gis.kdua.net
    if (hostname === "kdua.net" || hostname.endsWith(".kdua.net")) {
      return ".kdua.net";
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
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}

// ─────────────────────────────────────────────
// Realm Detection
// ─────────────────────────────────────────────

/**
 * Extracts the Keycloak realm name from the request host header.
 * 
 * Examples:
 * - `system-gis.kdua.net` → `ftth-realm` (system admin = default realm)
 * - `kircon-gis.kdua.net` → `kircon`
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
