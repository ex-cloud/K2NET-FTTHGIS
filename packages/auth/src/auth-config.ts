/**
 * @k2net/auth — Base Auth Config Factory
 *
 * Exports a `createBaseAuthConfig()` factory that both studio-admin and
 * studio-tenant portals use to build their NextAuth configuration.
 *
 * Each portal adds its own `authorized` callback (routing logic is
 * portal-specific) on top of this shared base.
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import { customFetch } from "next-auth";
import { z } from "zod";

import {
  logInfo,
  getCookieDomain,
  generateGravatar,
  refreshAccessToken,
  getRealmFromHost,
} from "./utils";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Maximum absolute session lifetime: 3 days. After this, user MUST re-login. */
const MAX_SESSION_LIFETIME_SECONDS = 3 * 24 * 60 * 60;

// ─────────────────────────────────────────────
// Keycloak Provider Factory (Internal URL bypass)
// ─────────────────────────────────────────────

function buildKeycloakProvider(issuer: string) {
  const rawServerUrl =
    process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "https://auth-gis.k2net.id";
  const serverUrl = rawServerUrl.endsWith("/")
    ? rawServerUrl.slice(0, -1)
    : rawServerUrl;
  const keycloakInternalUrl =
    process.env.AUTH_KEYCLOAK_INTERNAL_URL || "http://localhost:8081";

  let keycloakHost = "auth-gis.k2net.id";
  let keycloakProto = "https";
  try {
    const parsedUrl = new URL(serverUrl);
    keycloakHost = parsedUrl.host;
    keycloakProto = parsedUrl.protocol.replace(":", "");
  } catch (e) {
    console.error("[buildKeycloakProvider] Failed to parse server URL:", e);
  }

  return Keycloak({
    clientId: process.env.AUTH_KEYCLOAK_ID,
    clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
    issuer,
    // Route all server-side OIDC requests through internal Keycloak URL (bypass Cloudflare)
    [customFetch]: async (input, init) => {
      let urlStr = "";
      let requestInit: RequestInit = init || {};

      if (input instanceof Request) {
        urlStr = input.url;
        requestInit = input;
      } else {
        urlStr = input.toString();
      }

      if (urlStr.includes(serverUrl)) {
        const targetUrl = urlStr
          .replace(serverUrl, keycloakInternalUrl)
          .replace(`${serverUrl}:8081`, keycloakInternalUrl);

        console.log(
          `[customFetch] Rewriting: ${urlStr} -> ${targetUrl}`
        );

        const headers = new Headers(requestInit.headers);
        headers.set("X-Forwarded-Host", keycloakHost);
        headers.set("X-Forwarded-Proto", keycloakProto);

        if (input instanceof Request) {
          const newRequest = new Request(targetUrl, input);
          newRequest.headers.set("X-Forwarded-Host", keycloakHost);
          newRequest.headers.set("X-Forwarded-Proto", keycloakProto);
          return fetch(newRequest);
        } else {
          return fetch(targetUrl, { ...requestInit, headers });
        }
      }

      return fetch(input, init);
    },
    wellKnown: `${issuer.replace(serverUrl, keycloakInternalUrl)}/.well-known/openid-configuration`,
    token: `${issuer.replace(serverUrl, keycloakInternalUrl)}/protocol/openid-connect/token`,
    userinfo: `${issuer.replace(serverUrl, keycloakInternalUrl)}/protocol/openid-connect/userinfo`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ jwks_uri: `${issuer.replace(serverUrl, keycloakInternalUrl)}/protocol/openid-connect/certs` } as any),
  });
}

// ─────────────────────────────────────────────
// Credentials Provider
// ─────────────────────────────────────────────

function buildCredentialsProvider() {
  const rawServerUrl =
    process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "https://auth-gis.k2net.id";
  const serverUrl = rawServerUrl.endsWith("/")
    ? rawServerUrl.slice(0, -1)
    : rawServerUrl;
  const keycloakInternalUrl =
    process.env.AUTH_KEYCLOAK_INTERNAL_URL || "http://localhost:8081";

  let keycloakHost = "auth-gis.k2net.id";
  let keycloakProto = "https";
  try {
    const parsedUrl = new URL(serverUrl);
    keycloakHost = parsedUrl.host;
    keycloakProto = parsedUrl.protocol.replace(":", "");
  } catch {
    // fallback values already set
  }

  return Credentials({
    async authorize(credentials) {
      const parsedCredentials = z
        .object({
          username: z.string(),
          password: z.string().min(1),
          org: z.string().optional(),
        })
        .safeParse(credentials);

      if (!parsedCredentials.success) return null;

      const { username, password, org } = parsedCredentials.data;
      const orgSlug = org || "ftth-realm";

      try {
        const backendUrl =
          process.env.BACKEND_API_URL || "http://127.0.0.1:9090";

        // 1. Discover issuer for this org
        let issuerUrl = process.env.AUTH_KEYCLOAK_ISSUER;

        if (org && org !== "system") {
          try {
            console.log(`🌐 Discovering issuer for org: ${orgSlug}`);
            const discoveryRes = await fetch(
              `${backendUrl}/api/v1/auth/discovery/${orgSlug}`,
              { next: { revalidate: 3600 } }
            );

            if (discoveryRes.ok) {
              const discoveryData = await discoveryRes.json();
              if (discoveryData?.issuerUrl) {
                issuerUrl = discoveryData.issuerUrl;
                console.log(`✅ Discovered issuer for ${orgSlug}: ${issuerUrl}`);
              }
            } else {
              console.warn(`⚠️ Discovery failed for ${orgSlug}: ${discoveryRes.status}`);
            }
          } catch (discoveryError) {
            console.error(`❌ Discovery fetch error for ${orgSlug}:`, discoveryError);
          }
        }

        if (!issuerUrl) {
          console.error("❌ Could not resolve issuer for org:", orgSlug);
          return null;
        }

        // 2. Authenticate against discovered Keycloak realm (internal URL)
        const internalIssuerUrl = issuerUrl
          .replace(serverUrl, keycloakInternalUrl)
          .replace(`${serverUrl}:8081`, keycloakInternalUrl);

        const tokenResponse = await fetch(
          `${internalIssuerUrl}/protocol/openid-connect/token`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Forwarded-Host": keycloakHost,
              "X-Forwarded-Proto": keycloakProto,
            },
            body: new URLSearchParams({
              client_id: process.env.AUTH_KEYCLOAK_ID!,
              client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
              grant_type: "password",
              username,
              password,
              scope: "openid profile email",
            }),
            method: "POST",
          }
        );

        if (!tokenResponse.ok) {
          const errorBody = await tokenResponse.text();
          console.error(
            `❌ Keycloak Auth Failed for ${username} in ${orgSlug}. Status: ${tokenResponse.status}, Body: ${errorBody}`
          );
          return null;
        }

        const tokens = await tokenResponse.json();

        // 3. Fetch enriched profile from Spring Boot backend
        try {
          const profileResponse = await fetch(`${backendUrl}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });

          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            console.log("Profile enrichment success for:", profile.username);
            return {
              id: profile.id.toString(),
              email: profile.email,
              name: profile.fullName || profile.username,
              username: profile.username,
              avatar_url: profile.avatarUrl,
              image: profile.avatarUrl,
              organizationSlug: profile.organizationSlug,
              tokens,
            };
          } else {
            console.warn("Backend /me returned:", profileResponse.status);
          }
        } catch (profileError) {
          console.error("Failed to fetch backend profile:", profileError);
        }

        // Fallback profile
        console.log("Using fallback profile for:", username);
        return {
          id: "keycloak-user",
          email: username.includes("@") ? username : "",
          name: username,
          username,
          image: null,
          avatar_url: null,
          organizationSlug: orgSlug === "ftth-realm" ? null : orgSlug,
          tokens,
        };
      } catch (error) {
        console.error("Auth Error:", error);
        return null;
      }
    },
  });
}

// ─────────────────────────────────────────────
// Base Auth Config (Shared jwt / session / signIn)
// ─────────────────────────────────────────────

export const baseAuthConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    buildKeycloakProvider(process.env.AUTH_KEYCLOAK_ISSUER || ""),
    buildCredentialsProvider(),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // ── First Login ────────────────────────────────────────────────────────
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userWithTokens = user as any;

        // Credentials flow: tokens are embedded in user object
        if (userWithTokens.tokens) {
          let profile: Record<string, unknown> & { iss?: string } = {};
          try {
            const idToken = userWithTokens.tokens.id_token;
            profile = JSON.parse(
              Buffer.from(idToken.split(".")[1], "base64").toString()
            );
          } catch (e) {
            console.error("Failed to decode ID Token:", e);
          }

          // Extract roles from access token
          let roles: string[] = [];
          try {
            const payload = JSON.parse(
              Buffer.from(
                userWithTokens.tokens.access_token.split(".")[1],
                "base64"
              ).toString()
            );
            const realmRoles = payload.realm_access?.roles || [];
            const resourceRoles =
              payload.resource_access?.[process.env.AUTH_KEYCLOAK_ID!]?.roles || [];
            const rootRoles = payload.roles || [];
            roles = Array.from(new Set([...realmRoles, ...resourceRoles, ...rootRoles]));
          } catch (e) {
            console.error("Failed to decode Access Token roles:", e);
          }

          // Load fine-grained permissions from backend
          let permissions: string[] = [];
          try {
            const backendUrl =
              process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
            const profileRes = await fetch(`${backendUrl}/api/v1/users/me`, {
              headers: {
                Authorization: `Bearer ${userWithTokens.tokens.access_token}`,
              },
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              permissions = profileData.permissions || [];
              logInfo(
                `🔑 Loaded ${permissions.length} permissions (credentials)`
              );
            }
          } catch (e) {
            console.warn("Failed to fetch permissions (credentials):", e);
          }

          const credEmail =
            (profile.email as string) ||
            (user.email as string) ||
            (token.email as string);
          const credAvatarUrl =
            (profile.avatar_url as string) ||
            (profile.picture as string) ||
            userWithTokens.avatar_url ||
            userWithTokens.image ||
            generateGravatar(credEmail);

          logInfo(
            `🔑 Credentials login. Issuer from ID token: ${profile.iss}`
          );

          return {
            ...token,
            accessToken: userWithTokens.tokens.access_token,
            refreshToken: userWithTokens.tokens.refresh_token,
            idToken: userWithTokens.tokens.id_token,
            issuer: profile.iss as string,
            issuedAt: Math.floor(Date.now() / 1000),
            expiresAt: Math.floor(
              Date.now() / 1000 + userWithTokens.tokens.expires_in
            ),
            user: {
              id: user.id || token.sub,
              email: credEmail,
              name:
                (profile.preferred_username as string) ||
                userWithTokens.preferred_username ||
                (profile.name as string) ||
                user.name ||
                token.name,
              avatar_url: credAvatarUrl,
              username:
                (profile.preferred_username as string) ||
                userWithTokens.username ||
                userWithTokens.preferred_username,
              roles,
              permissions,
              organizationSlug: userWithTokens.organizationSlug || null,
            },
          };
        }

        // OAuth / Keycloak redirect flow
        if (account) {
          let issuer = process.env.AUTH_KEYCLOAK_ISSUER;
          if (account.id_token) {
            try {
              const payload = JSON.parse(
                Buffer.from(account.id_token.split(".")[1], "base64").toString()
              );
              issuer = payload.iss;
            } catch (e) {
              console.error("Failed to decode ID Token (OAuth):", e);
            }
          }

          let roles: string[] = [];
          if (account.access_token) {
            try {
              const payload = JSON.parse(
                Buffer.from(
                  account.access_token.split(".")[1],
                  "base64"
                ).toString()
              );
              const realmRoles = payload.realm_access?.roles || [];
              const resourceRoles =
                payload.resource_access?.[process.env.AUTH_KEYCLOAK_ID!]?.roles || [];
              const rootRoles = payload.roles || [];
              roles = Array.from(
                new Set([...realmRoles, ...resourceRoles, ...rootRoles])
              );
            } catch (e) {
              console.error("Failed to decode Access Token roles (OAuth):", e);
            }
          }

          let orgSlug = "ftth-realm";
          if (issuer) {
            const parts = issuer.split("/");
            orgSlug = parts[parts.length - 1];
          }

          let oauthPermissions: string[] = [];
          if (account.access_token) {
            try {
              const backendUrl =
                process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
              const profileRes = await fetch(`${backendUrl}/api/v1/users/me`, {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                },
              });
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                oauthPermissions = profileData.permissions || [];
                logInfo(
                  `🔑 Loaded ${oauthPermissions.length} permissions (OAuth)`
                );
              }
            } catch (e) {
              console.warn("Failed to fetch permissions (OAuth):", e);
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exUser = user as any;
          const oauthEmail = exUser.email || user.email;
          const oauthAvatarUrl =
            exUser.avatar_url || exUser.image || generateGravatar(oauthEmail as string);

          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            issuer,
            issuedAt: Math.floor(Date.now() / 1000),
            expiresAt: account.expires_at,
            user: {
              ...user,
              name:
                exUser.preferred_username || exUser.username || user.name,
              avatar_url: oauthAvatarUrl,
              username: exUser.preferred_username || exUser.username,
              roles,
              permissions: oauthPermissions,
              organizationSlug:
                orgSlug === "ftth-realm" ? null : orgSlug,
            },
          };
        }
      }

      // ── Subsequent Requests ────────────────────────────────────────────────
      // Enforce absolute session lifetime
      const sessionAge =
        Math.floor(Date.now() / 1000) - ((token.issuedAt as number) || 0);
      if (token.issuedAt && sessionAge > MAX_SESSION_LIFETIME_SECONDS) {
        logInfo(
          `⏰ Session expired for ${token.email}: ${Math.floor(sessionAge / 3600)}h > max ${MAX_SESSION_LIFETIME_SECONDS / 3600}h. Forcing re-login.`
        );
        return { ...token, error: "RefreshAccessTokenError" as const };
      }

      // Return token if not expired (15s buffer)
      const isExpired =
        Date.now() > ((token.expiresAt as number) || 0) * 1000 - 15000;
      if (!isExpired) return token;

      // Refresh expired token
      const refreshed = await refreshAccessToken(token as Parameters<typeof refreshAccessToken>[0]);
      return refreshed;
    },

    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.idToken) session.idToken = token.idToken as string;
      if (token.error) session.error = token.error as "RefreshAccessTokenError";
      if (token.issuer) session.issuer = token.issuer as string;

      if (token.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokenUser = token.user as any;
        session.user = {
          ...session.user,
          id: tokenUser.id || session.user.id,
          username: tokenUser.username,
          roles: tokenUser.roles || [],
          permissions: tokenUser.permissions || [],
          avatar_url: tokenUser.avatar_url,
          organizationSlug: tokenUser.organizationSlug,
        };
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[Session] User Roles:", session.user?.roles);
      }

      return session;
    },

    async signIn({ user, account }) {
      // Only gate-check OAuth/Keycloak logins
      if (account?.provider !== "keycloak") return true;

      const email = user.email;
      if (!email) {
        logInfo("❌ OAuth signIn blocked: no email");
        return "/login?error=no_email";
      }

      let clientIp = "127.0.0.1";
      let userAgent = "unknown";
      let deviceId = "unknown";

      try {
        // Dynamically import next/headers (server-only, not available in edge)
        const { headers } = await import("next/headers");
        const reqHeaders = await headers();
        clientIp =
          reqHeaders.get("x-forwarded-for") ||
          reqHeaders.get("x-real-ip") ||
          "127.0.0.1";
        if (clientIp.includes(",")) {
          clientIp = clientIp.split(",")[0].trim();
        }
        userAgent = reqHeaders.get("user-agent") || "unknown";

        const cookieHeader = reqHeaders.get("cookie") || "";
        const deviceIdMatch = cookieHeader.match(/device_id=([^;]+)/);
        if (deviceIdMatch) deviceId = deviceIdMatch[1];
      } catch (e) {
        console.warn("Failed to read request headers in signIn:", e);
      }

      try {
        const backendUrl =
          process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
        const internalSecret =
          process.env.INTERNAL_API_SECRET || "ftth-internal-secret-2026";

        logInfo(`🔐 OAuth gate check for: ${email} (IP: ${clientIp})`);

        const res = await fetch(`${backendUrl}/api/v1/auth/oauth-gate/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": internalSecret,
          },
          body: JSON.stringify({ email, ip: clientIp, userAgent, deviceId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.allowed === true) {
            logInfo(`✅ OAuth gate ALLOWED: ${email}`);
            return true;
          }
          logInfo(`🚫 OAuth gate BLOCKED: ${email} (${data.reason})`);
          if (data.reason === "suspended") return "/login?error=suspended";
          return "/login?error=not_registered";
        }

        logInfo(`⚠️ OAuth gate API ${res.status} for ${email} — allowing as fallback`);
        return true;
      } catch (error) {
        console.error("OAuth gate check failed:", error);
        return true; // Allow on network error
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name: "k2net-gis.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        domain: getCookieDomain(),
        secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"),
      },
    },
    callbackUrl: {
      name: "k2net-gis.callback-url",
      options: {
        path: "/",
        domain: getCookieDomain(),
        secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"),
      },
    },
    csrfToken: {
      name: "k2net-gis.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        domain: getCookieDomain(),
        secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"),
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 3 days
  },
};

// ─────────────────────────────────────────────
// Dynamic Auth Config (per-tenant Keycloak realm)
// ─────────────────────────────────────────────

/**
 * Creates a NextAuth config with a dynamic Keycloak realm based on the
 * incoming request host (used in the NextAuth route handler).
 *
 * Usage in `apps/studio-tenant/src/app/api/auth/[...nextauth]/route.ts`:
 * ```ts
 * import { getDynamicAuthConfig } from "@k2net/auth";
 * import { headers } from "next/headers";
 * import NextAuth from "next-auth";
 *
 * const handler = async (req: Request) => {
 *   const host = req.headers.get("host");
 *   return NextAuth(getDynamicAuthConfig(host))(req);
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDynamicAuthConfig(host: string | null): any {
  const realm = getRealmFromHost(host || "");
  const rawServerUrl =
    process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "https://auth-gis.k2net.id";
  const serverUrl = rawServerUrl.endsWith("/")
    ? rawServerUrl.slice(0, -1)
    : rawServerUrl;
  const dynamicIssuer = `${serverUrl}/realms/${realm}`;

  console.log(
    `[getDynamicAuthConfig] Host: ${host} → Realm: ${realm} → Issuer: ${dynamicIssuer}`
  );

  const dynamicKeycloakProvider = buildKeycloakProvider(dynamicIssuer);

  return {
    ...baseAuthConfig,
    providers: [
      dynamicKeycloakProvider,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...baseAuthConfig.providers.filter((p: any) => p.id !== "keycloak"),
    ],
  };
}

// ─────────────────────────────────────────────
// Convenience: create NextAuth instance directly
// ─────────────────────────────────────────────

/**
 * Creates a NextAuth instance from the base config + an optional
 * app-specific `authorized` callback override.
 *
 * Usage in `apps/studio-admin/src/auth.ts`:
 * ```ts
 * import { createAuth } from "@k2net/auth";
 * export const { handlers, signIn, signOut, auth } = createAuth({
 *   authorized({ auth, request }) { ... }  // admin-specific routing guard
 * });
 * ```
 */
export function createAuth(
  authorizedCallback?: any
) {
  const config: NextAuthConfig = {
    ...baseAuthConfig,
    callbacks: {
      ...baseAuthConfig.callbacks,
      ...(authorizedCallback ? { authorized: authorizedCallback } : {}),
    },
  };
  return NextAuth(config);
}
