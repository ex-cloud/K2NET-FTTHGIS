import NextAuth, { DefaultSession, customFetch, type NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import authConfig from "./auth.config";
import { JWT as NextAuthJWT } from "next-auth/jwt";
import { headers } from "next/headers";
import { createHash } from "crypto";

interface KeycloakIdTokenPayload {
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
  picture?: string;
  avatar_url?: string;
  iss?: string;
}

declare module "next-auth" {
  interface User {
    username?: string | null;
    preferred_username?: string;
    avatar_url?: string | null;
    roles?: string[];
    organizationSlug?: string | null;
  }

  interface Session extends DefaultSession {
    accessToken?: string;
    idToken?: string;
    issuer?: string;
    error?: "RefreshAccessTokenError";
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    issuer?: string;
    expiresAt?: number;
    issuedAt?: number; // Tracks when the session was first created (epoch seconds)
    user?: import("next-auth").User;
  }
}

// Maximum absolute session lifetime in seconds (3 days)
// After this time, user MUST re-login regardless of activity
const MAX_SESSION_LIFETIME_SECONDS = 3 * 24 * 60 * 60; // 3 days = 259200 seconds

async function refreshAccessToken(token: NextAuthJWT) {
  try {
    // Dynamic Issuer: Use the issuer stored in the token if available, otherwise fallback to env
    const issuer = (token.issuer as string) || process.env.AUTH_KEYCLOAK_ISSUER || "";
    
    logInfo(`Refreshing token for user ${token.email} using issuer: ${issuer}`);

    const rawServerUrl = process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "https://auth-gis.k2net.id";
    const serverUrl = rawServerUrl.endsWith("/") ? rawServerUrl.slice(0, -1) : rawServerUrl;

    let keycloakHost = "auth-gis.k2net.id";
    let keycloakProto = "https";
    try {
      const parsedUrl = new URL(serverUrl);
      keycloakHost = parsedUrl.host;
      keycloakProto = parsedUrl.protocol.replace(":", "");
    } catch (e) {
      console.error("[refreshAccessToken] Failed to parse NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL:", e);
    }

    const keycloakInternalUrl = process.env.AUTH_KEYCLOAK_INTERNAL_URL || "http://localhost:8081";
    // Bypass Cloudflare challenge for server-to-server token refresh
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
      },
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
    console.error("Error refreshing Access Token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError" as const,
    };
  }
}

// Helper for logging since we are in a server context
function logInfo(msg: string) {
  console.log(`[Auth.ts] ${new Date().toISOString()}: ${msg}`);
}

/**
 * Generate a Gravatar URL from an email address.
 * Falls back to identicon (geometric pattern) if no Gravatar exists.
 * This ensures a consistent avatar across all login methods.
 */
function generateGravatar(email: string | null | undefined): string | null {
  if (!email) return null;
  const hash = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}

function getCookieDomain() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return undefined;
  try {
    const hostname = new URL(appUrl).hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return undefined;
    }

    // Shared cookie domain for the trusted k2net.id platform.
    // This covers both `system-gis.k2net.id` and subdomains like `garut.gis.k2net.id`.
    if (hostname === "k2net.id" || hostname.endsWith(".k2net.id")) {
      return ".k2net.id";
    }

    // For hyphen-style hosts like system-gis.k2net.id, use host-only cookies.
    // Browser rejects `.gis.k2net.id` for this pattern because it is not a parent domain.
    return undefined;
  } catch {
    return undefined;
  }
}

export const baseAuthOptions: NextAuthConfig = {
  ...authConfig,
  callbacks: {
    async jwt({ token, account, user }) {
      // 1. First Login - Handle both OAuth and Credentials
      if (user) {
        // Handle Credentials provider (account is null/undefined in some v4/v5 versions for Credentials)
        const userWithTokens = user as {
          tokens?: {
            access_token: string;
            refresh_token: string;
            id_token: string;
            expires_in: number;
          };
        };

        if (userWithTokens.tokens) {
          // Enrich profile from ID Token
          let profile: KeycloakIdTokenPayload & { iss?: string } = {};
          try {
            const idToken = userWithTokens.tokens.id_token;
            const payload = JSON.parse(
              Buffer.from(idToken.split(".")[1], "base64").toString(),
            );
            profile = payload;
          } catch (e) {
            console.error("Failed to decode ID Token", e);
          }

          // Extract roles from Access Token
          let roles: string[] = [];
          try {
            const accessToken = userWithTokens.tokens.access_token;
            const payload = JSON.parse(
              Buffer.from(accessToken.split(".")[1], "base64").toString(),
            );
            // Aggressive Role Extraction (Keycloak can be inconsistent)
            const realmRoles = payload.realm_access?.roles || [];
            const resourceRoles = payload.resource_access?.[process.env.AUTH_KEYCLOAK_ID!]?.roles || [];
            const rootRoles = payload.roles || [];
            
            roles = Array.from(new Set([...realmRoles, ...resourceRoles, ...rootRoles]));
          } catch (e) {
            console.error("Failed to decode Access Token roles in Credentials flow", e);
          }

          const exUser = user as import("next-auth").User;

          // Fetch fine-grained permissions from backend profile
          let permissions: string[] = [];
          try {
            const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
            const profileRes = await fetch(`${backendUrl}/api/v1/users/me`, {
              headers: { Authorization: `Bearer ${userWithTokens.tokens.access_token}` },
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              permissions = profileData.permissions || [];
              logInfo(`🔑 Loaded ${permissions.length} permissions for credentials user`);
            }
          } catch (e) {
            console.warn("[Auth.ts] Failed to fetch permissions for credentials user:", e);
          }

          const credEmail = profile.email || exUser.email || token.email;
          const credAvatarUrl =
            profile.avatar_url ||
            profile.picture ||
            exUser.avatar_url ||
            exUser.image ||
            generateGravatar(credEmail as string); // Gravatar fallback for consistent avatar across login methods

          const enrichedUser = {
            id: user.id || token.sub,
            email: credEmail,
            // Prefer username (e.g. "xsuperadmin") over full name ("Super Admin") for consistent display
            name:
              profile.preferred_username ||
              exUser.preferred_username ||
              profile.name ||
              exUser.name ||
              token.name,
            avatar_url: credAvatarUrl,
            username:
              profile.preferred_username ||
              exUser.username ||
              exUser.preferred_username,
            roles: roles,
            permissions: permissions,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth user type does not expose organizationSlug
            organizationSlug: (user as any).organizationSlug || null,
          };

          logInfo(`🔑 Login via Credentials. Issuer extracted from ID token: ${profile.iss}`);

          return {
            ...token,
            accessToken: userWithTokens.tokens.access_token,
            refreshToken: userWithTokens.tokens.refresh_token,
            idToken: userWithTokens.tokens.id_token,
            issuer: profile.iss, // Store issuer for dynamic refresh!
            issuedAt: Math.floor(Date.now() / 1000), // Track session creation time
            expiresAt: Math.floor(
              Date.now() / 1000 + userWithTokens.tokens.expires_in,
            ),
            user: enrichedUser,
          };
        }

        // Handle OAuth provider (Keycloak redirect flow - account exists)
        if (account) {
          const exUser = user as import("next-auth").User;
          
          // Extract issuer from ID token for OAuth flow too
          let issuer = process.env.AUTH_KEYCLOAK_ISSUER;
          if (account.id_token) {
            try {
               const payload = JSON.parse(
                 Buffer.from(account.id_token.split(".")[1], "base64").toString(),
               );
               issuer = payload.iss;
            } catch (e) {
               console.error("Failed to decode ID Token in OAuth flow", e);
            }
          }

          // Extract roles from Access Token (Keycloak stores them in realm_access.roles)
          let roles: string[] = [];
          if (account.access_token) {
            try {
              const payload = JSON.parse(
                Buffer.from(account.access_token.split(".")[1], "base64").toString(),
              );
              // Aggressive Role Extraction (OAuth Flow)
              const realmRoles = payload.realm_access?.roles || [];
              const resourceRoles = payload.resource_access?.[process.env.AUTH_KEYCLOAK_ID!]?.roles || [];
              const rootRoles = payload.roles || [];
              
              roles = Array.from(new Set([...realmRoles, ...resourceRoles, ...rootRoles]));
            } catch (e) {
              console.error("Failed to decode Access Token roles", e);
            }
          }

          let orgSlug = "ftth-realm";
          if (issuer) {
            const parts = issuer.split("/");
            orgSlug = parts[parts.length - 1];
          }

          // Fetch fine-grained permissions from backend profile (OAuth flow)
          let oauthPermissions: string[] = [];
          if (account.access_token) {
            try {
              const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
              const profileRes = await fetch(`${backendUrl}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              });
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                oauthPermissions = profileData.permissions || [];
                logInfo(`🔑 Loaded ${oauthPermissions.length} permissions for OAuth user`);
              }
            } catch (e) {
              console.warn("[Auth.ts] Failed to fetch permissions for OAuth user:", e);
            }
          }

          const oauthEmail = exUser.email || user.email;
          const oauthAvatarUrl =
            exUser.avatar_url ||
            exUser.image ||
            generateGravatar(oauthEmail as string); // Gravatar fallback for SSO login

          token.user = {
            ...user,
            // Prefer preferred_username (e.g. "xsuperadmin") over full display name ("Super Admin")
            // This ensures the displayed name is consistent between credentials and SSO login.
            name:
              exUser.preferred_username ||
              exUser.username ||
              user.name,
            avatar_url: oauthAvatarUrl,
            username: exUser.preferred_username || exUser.username,
            roles: roles,
            permissions: oauthPermissions,
            organizationSlug: orgSlug === "ftth-realm" ? null : orgSlug,
          };
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            issuer: issuer, // Store issuer for dynamic refresh!
            issuedAt: Math.floor(Date.now() / 1000), // Track session creation time
            expiresAt: account.expires_at,
          };
        }
      }

      // 2. Check absolute session lifetime — force re-login after MAX_SESSION_LIFETIME_SECONDS
      // This prevents infinite sessions where refresh tokens keep extending the session
      const sessionAge = Math.floor(Date.now() / 1000) - (token.issuedAt as number || 0);
      if (token.issuedAt && sessionAge > MAX_SESSION_LIFETIME_SECONDS) {
        logInfo(`⏰ Session expired for user ${token.email}: session age ${Math.floor(sessionAge / 3600)}h exceeds max ${MAX_SESSION_LIFETIME_SECONDS / 3600}h. Forcing re-login.`);
        return {
          ...token,
          error: "RefreshAccessTokenError" as const,
        };
      }

      // 3. Return previous token if the access token has not expired yet
      // buffer time 15s (increased from 10s)
      const isExpired = Date.now() > (token.expiresAt as number) * 1000 - 15000;
      if (!isExpired) {
        return token;
      }

      // 4. Access token has expired, try to update it
      const refreshedToken = await refreshAccessToken(token);
      
      if (refreshedToken.error === "RefreshAccessTokenError") {
        return refreshedToken; 
      }

      return refreshedToken;
    },
    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.idToken) session.idToken = token.idToken as string;
      if (token.error) session.error = token.error as "RefreshAccessTokenError";
      if (token.issuer) session.issuer = token.issuer as string;
      
      if (token.user) {
        const tokenUser = token.user;
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
      
      // Server-side Debug
      if (process.env.NODE_ENV === "development") {
        console.log(`[Session Callback] User Roles:`, session.user?.roles);
      }
      
      return session;
    },
    async signIn({ user, account }) {
      // Only intercept OAuth/Keycloak logins (not Credentials)
      if (account?.provider === "keycloak") {
        const email = user.email;
        if (!email) {
          logInfo("❌ OAuth signIn blocked: no email in user object");
          return "/login?error=no_email";
        }

        let clientIp = "127.0.0.1";
        let userAgent = "unknown";
        let deviceId = "unknown";

        try {
          const reqHeaders = await headers();
          clientIp = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
          if (clientIp.includes(",")) {
            clientIp = clientIp.split(",")[0].trim();
          }
          userAgent = reqHeaders.get("user-agent") || "unknown";
          
          const cookieHeader = reqHeaders.get("cookie") || "";
          const deviceIdMatch = cookieHeader.match(/device_id=([^;]+)/);
          if (deviceIdMatch) {
            deviceId = deviceIdMatch[1];
          }
        } catch (e) {
          console.warn("Failed to retrieve request headers in signIn callback:", e);
        }

        try {
          const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
          const internalSecret = process.env.INTERNAL_API_SECRET || "ftth-internal-secret-2026";

          logInfo(`🔐 OAuth gate check for: ${email} (IP: ${clientIp}, DeviceID: ${deviceId})`);

          const res = await fetch(`${backendUrl}/api/v1/auth/oauth-gate/check`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Secret": internalSecret,
            },
            body: JSON.stringify({ 
              email,
              ip: clientIp,
              userAgent,
              deviceId
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.allowed === true) {
              logInfo(`✅ OAuth gate ALLOWED for: ${email}`);
              return true;
            } else {
              logInfo(`🚫 OAuth gate BLOCKED for: ${email} (reason: ${data.reason})`);
              if (data.reason === "suspended") {
                return "/login?error=suspended";
              }
              return "/login?error=not_registered";
            }
          } else {
            logInfo(`⚠️ OAuth gate API returned ${res.status} for: ${email}, allowing as fallback`);
            return true; // Allow on API error to avoid locking out legitimate users
          }
        } catch (error) {
          console.error("OAuth gate check failed:", error);
          return true; // Allow on network error to avoid locking out legitimate users
        }
      }
      return true; // Allow Credentials and other providers
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
        sameSite: "lax",
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
        sameSite: "lax",
        path: "/",
        domain: getCookieDomain(),
        secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"),
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 3 days session expiration (matches Keycloak offline session max lifespan)
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(baseAuthOptions);

/**
 * Cleanly extract the Keycloak realm name from the request hostname/headers.
 * Examples:
 * - system-gis.k2net.id -> ftth-realm
 * - garut-gis.k2net.id -> garut
 * - localhost:3000 -> ftth-realm (default fallback)
 */
export function getRealmFromHost(host: string): string {
  if (!host) return "ftth-realm";
  
  // Clean port if present (e.g., garut.localhost:3000 -> garut.localhost)
  const cleanHost = host.split(":")[0];
  
  // If localhost or pure IP, use system default realm
  if (
    cleanHost === "localhost" || 
    cleanHost === "127.0.0.1" || 
    cleanHost.match(/^\d+\.\d+\.\d+\.\d+$/)
  ) {
    return "ftth-realm";
  }
  
  // Extract subdomain (first part of host before dot)
  const subdomain = cleanHost.split(".")[0];
  if (!subdomain || subdomain.startsWith("system")) {
    return "ftth-realm";
  }
  
  // Strip suffix -gis if present (e.g. garut-gis -> garut)
  let realm = subdomain;
  if (subdomain.endsWith("-gis")) {
    realm = subdomain.substring(0, subdomain.length - 4);
  }
  
  // Sanitize realm name to prevent injection or directory traversal
  return realm.replace(/[^a-zA-Z0-9-]/g, "");
}

/**
 * Create a customized NextAuthConfig where Keycloak is dynamically
 * configured with the correct OIDC endpoints matching the current tenant realm.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Returns dynamic NextAuth config object with modified providers
export function getDynamicAuthConfig(host: string | null): any {
  const realm = getRealmFromHost(host || "");
  const rawServerUrl = process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "https://auth-gis.k2net.id";
  const serverUrl = rawServerUrl.endsWith("/") ? rawServerUrl.slice(0, -1) : rawServerUrl;
  const keycloakInternalUrl = process.env.AUTH_KEYCLOAK_INTERNAL_URL || "http://localhost:8081";
  const dynamicIssuer = `${serverUrl}/realms/${realm}`;

  let keycloakHost = "auth-gis.k2net.id";
  let keycloakProto = "https";
  try {
    const parsedUrl = new URL(serverUrl);
    keycloakHost = parsedUrl.host;
    keycloakProto = parsedUrl.protocol.replace(":", "");
  } catch (e) {
    console.error("[getDynamicAuthConfig] Failed to parse NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL:", e);
  }

  console.log(`[getDynamicAuthConfig] Host: ${host} -> Resolved Realm: ${realm} -> Dynamic Issuer: ${dynamicIssuer} (Host: ${keycloakHost}, Proto: ${keycloakProto})`);

  // Create a customized Keycloak provider for this realm
  const dynamicKeycloakProvider = Keycloak({
    clientId: process.env.AUTH_KEYCLOAK_ID,
    clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
    issuer: dynamicIssuer,
    // customFetch to route server-side requests internally to Keycloak (localhost:8081)
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
        
        console.log(`[customFetch Dynamic] Intercepting and rewriting URL: ${urlStr} -> ${targetUrl}`);
        
        const headersList = new Headers(requestInit.headers);
        headersList.set("X-Forwarded-Host", keycloakHost);
        headersList.set("X-Forwarded-Proto", keycloakProto);
        
        if (input instanceof Request) {
          const newRequest = new Request(targetUrl, input);
          newRequest.headers.set("X-Forwarded-Host", keycloakHost);
          newRequest.headers.set("X-Forwarded-Proto", keycloakProto);
          return fetch(newRequest);
        } else {
          return fetch(targetUrl, {
            ...requestInit,
            headers: headersList,
          });
        }
      }

      return fetch(input, init);
    },
    // Bypass Cloudflare 403 on OIDC Discovery by using internal URL.
    wellKnown: `${dynamicIssuer.replace(serverUrl, keycloakInternalUrl)}/.well-known/openid-configuration`,
    token: `${dynamicIssuer.replace(serverUrl, keycloakInternalUrl)}/protocol/openid-connect/token`,
    userinfo: `${dynamicIssuer.replace(serverUrl, keycloakInternalUrl)}/protocol/openid-connect/userinfo`,
    ...({
      jwks_uri: `${dynamicIssuer.replace(serverUrl, keycloakInternalUrl)}/protocol/openid-connect/certs`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required to bypass OIDCUserConfig type limitation for runtime jwks_uri
    } as any),
  });

  return {
    ...baseAuthOptions,
    providers: [
      dynamicKeycloakProvider,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth Provider is a complex union type
      ...baseAuthOptions.providers.filter((p: any) => p.id !== "keycloak"),
    ],
  };
}

