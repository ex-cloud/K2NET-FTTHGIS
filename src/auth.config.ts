import type { NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

export default {
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/org");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Redirect logged-in users away from login page or root
        if (nextUrl.pathname === "/login" || nextUrl.pathname === "/") {
          return Response.redirect(new URL("/org", nextUrl));
        }
      }
      return true;
    },
  },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
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
                const discoveryRes = await fetch(`${backendUrl}/api/v1/auth/discovery/${orgSlug}`);
                if (discoveryRes.ok) {
                    const discoveryData = await discoveryRes.json();
                    issuerUrl = discoveryData.issuerUrl;
                    console.log(`🌐 Discovered issuer for ${orgSlug}: ${issuerUrl}`);
                }
            }

            if (!issuerUrl) {
                console.error("❌ Could not resolve issuer for organization:", orgSlug);
                return null;
            }

            // 2. Authenticate against the discovered Keycloak realm
            const tokenResponse = await fetch(
              `${issuerUrl}/protocol/openid-connect/token`,
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
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

            if (!tokenResponse.ok) return null;

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
