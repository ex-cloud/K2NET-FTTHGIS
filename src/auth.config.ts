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
          .object({ username: z.string(), password: z.string().min(1) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;

          try {
            const tokenResponse = await fetch(
              `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
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
