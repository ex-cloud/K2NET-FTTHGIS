import type { NextAuthConfig } from "next-auth";
import { customFetch } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

export default {
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl, headers } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const hostname = headers.get("x-forwarded-host") || headers.get("host") || "";
      const isSystemSubdomain = hostname.startsWith("system.") || hostname.startsWith("system-");

      // 1. System Admin Area Protection (via Subdomain)
      if (isSystemSubdomain) {
        const isLogin = pathname === "/login" || pathname === "/system/login";
        if (isLogin) {
          if (isLoggedIn) return Response.redirect(new URL("/organizations", nextUrl));
          return true;
        }
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
        return true;
      }

      // 2. Tenant/User Area Protection
      // On a tenant subdomain, all paths except login are considered tenant paths
      // On the root domain, only paths starting with /org or /dashboard are tenant paths
      const isTenantPath = isSystemSubdomain 
        ? false 
        : (hostname.includes(".") ? (pathname !== "/login") : (pathname.startsWith("/org") || pathname.startsWith("/dashboard")));

      if (isTenantPath) {
        if (isLoggedIn) return true;
        return false; // Default redirect to /login
      }

      // 3. Redirect logged-in users away from root domain landing/login
      if (isLoggedIn && (pathname === "/login" || pathname === "/")) {
        // If they are on a tenant subdomain, this wouldn't trigger as isTenantPath matches /dashboard
        // This is mainly for root domain
        return Response.redirect(new URL("/org", nextUrl));
      }

      return true;
    },
  },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
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

        if (urlStr.includes("https://auth-gis.k2net.id")) {
          const targetUrl = urlStr
            .replace("https://auth-gis.k2net.id", "http://localhost:8081")
            .replace("https://auth-gis.k2net.id:8081", "http://localhost:8081");
          
          console.log(`[customFetch] Intercepting and rewriting URL: ${urlStr} -> ${targetUrl}`);
          
          // Modify headers to preserve host information for Keycloak multi-tenant routing
          const headers = new Headers(requestInit.headers);
          headers.set("X-Forwarded-Host", "auth-gis.k2net.id");
          headers.set("X-Forwarded-Proto", "https");
          
          if (input instanceof Request) {
            const newRequest = new Request(targetUrl, input);
            newRequest.headers.set("X-Forwarded-Host", "auth-gis.k2net.id");
            newRequest.headers.set("X-Forwarded-Proto", "https");
            return fetch(newRequest);
          } else {
            return fetch(targetUrl, {
              ...requestInit,
              headers,
            });
          }
        }

        return fetch(input, init);
      },
      // Bypass Cloudflare 403 on OIDC Discovery by using internal URL.
      // Keycloak is configured with KC_HOSTNAME so it returns correct public URLs
      // (https://auth-gis.k2net.id/...) even when queried internally.
      wellKnown: `${(process.env.AUTH_KEYCLOAK_ISSUER || "").replace("https://auth-gis.k2net.id", "http://localhost:8081")}/.well-known/openid-configuration`,
      // Server-side token exchange also needs internal URL to bypass Cloudflare
      token: `${(process.env.AUTH_KEYCLOAK_ISSUER || "").replace("https://auth-gis.k2net.id", "http://localhost:8081")}/protocol/openid-connect/token`,
      userinfo: `${(process.env.AUTH_KEYCLOAK_ISSUER || "").replace("https://auth-gis.k2net.id", "http://localhost:8081")}/protocol/openid-connect/userinfo`,
      // Bypass TypeScript OIDCUserConfig limitation to pass runtime jwks_uri
      ...({
        jwks_uri: `${(process.env.AUTH_KEYCLOAK_ISSUER || "").replace("https://auth-gis.k2net.id", "http://localhost:8081")}/protocol/openid-connect/certs`,
      } as any),
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ 
            username: z.string(), 
            password: z.string().min(1),
            org: z.string().optional() 
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password, org } = parsedCredentials.data;
          const orgSlug = org || "ftth-realm"; // Fallback to default if not provided

          try {
            const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
            
            // 1. Discover the Issuer for this organization
            let issuerUrl = process.env.AUTH_KEYCLOAK_ISSUER;
            
            if (org && org !== "system") {
                try {
                    console.log(`🌐 Discovering issuer for org: ${orgSlug} via ${backendUrl}`);
                    const discoveryRes = await fetch(`${backendUrl}/api/v1/auth/discovery/${orgSlug}`, {
                        next: { revalidate: 3600 } // Cache discovery for 1 hour
                    });
                    
                    if (discoveryRes.ok) {
                        const discoveryData = await discoveryRes.json();
                        if (discoveryData && discoveryData.issuerUrl) {
                            issuerUrl = discoveryData.issuerUrl;
                            console.log(`✅ Discovered issuer for ${orgSlug}: ${issuerUrl}`);
                        }
                    } else {
                        console.warn(`⚠️ Discovery failed for ${orgSlug}, status: ${discoveryRes.status}`);
                    }
                } catch (discoveryError) {
                    console.error(`❌ Discovery fetch error for ${orgSlug}:`, discoveryError);
                    // Keep fallback issuerUrl if fetch fails
                }
            }

            if (!issuerUrl) {
                console.error("❌ Could not resolve issuer for organization:", orgSlug);
                return null;
            }

            // 2. Authenticate against the discovered Keycloak realm
            // Bypass Cloudflare challenge for server-to-server calls
            const internalIssuerUrl = issuerUrl
              .replace("https://auth-gis.k2net.id", "http://localhost:8081")
              .replace("https://auth-gis.k2net.id:8081", "http://localhost:8081");

            const tokenResponse = await fetch(
              `${internalIssuerUrl}/protocol/openid-connect/token`,
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "X-Forwarded-Host": "auth-gis.k2net.id",
                  "X-Forwarded-Proto": "https",
                },
                body: new URLSearchParams({
                  client_id: process.env.AUTH_KEYCLOAK_ID!,
                  client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
                  grant_type: "password",
                  username: username,
                  password: password,
                  scope: "openid profile email offline_access",
                }),
                method: "POST",
              },
            );

            if (!tokenResponse.ok) {
                const errorBody = await tokenResponse.text();
                console.error(`❌ Keycloak Auth Failed for ${username} in ${orgSlug}. Status: ${tokenResponse.status}, Body: ${errorBody}`);
                return null;
            }

            const tokens = await tokenResponse.json();

            // Fetch the user profile from the BACKEND (Spring Boot) using the access token
            // This ensures we get the most up-to-date avatar_url, username, etc. from Postgres
            try {
              const backendUrl =
                process.env.BACKEND_API_URL || "http://127.0.0.1:9090";
              const profileResponse = await fetch(
                `${backendUrl}/api/v1/users/me`,
                {
                  headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                  },
                },
              );

              if (profileResponse.ok) {
                const profile = await profileResponse.json();
                console.log(
                  "Profile enrichment success for:",
                  profile.username,
                );
                return {
                  id: profile.id.toString(),
                  email: profile.email,
                  name: profile.fullName || profile.username,
                  username: profile.username,
                  avatar_url: profile.avatarUrl,
                  image: profile.avatarUrl, // Legacy compat
                  organizationSlug: profile.organizationSlug,
                  tokens: tokens,
                };
              } else {
                console.warn(
                  "Backend /me returned status:",
                  profileResponse.status,
                );
              }
            } catch (profileError) {
              console.error(
                "Failed to fetch user profile from backend:",
                profileError,
              );
            }

            // Robust Fallback (Matches what UserNav expects)
            console.log("Using fallback profile for:", username);
            return {
              id: "keycloak-user",
              email: username.includes("@") ? username : "",
              name: username,
              username: username,
              image: null,
              avatar_url: null,
              organizationSlug: orgSlug === "ftth-realm" ? null : orgSlug,
              tokens: tokens,
            };
          } catch (error) {
            console.error("Auth Error:", error);
            return null;
          }
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
