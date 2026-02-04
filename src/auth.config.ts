import type { NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

export default {
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string(), password: z.string().min(1) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

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
                  username: email,
                  password: password,
                  scope: "openid profile email offline_access",
                }),
                method: "POST",
              },
            );

            if (!tokenResponse.ok) return null;

            const tokens = await tokenResponse.json();

            // Decode token to get user info (or call userinfo endpoint)
            // For simplicity, we trust the token. We need to attach tokens to the user object
            // so jwt callback can pick them up.

            return {
              id: "keycloak-user", // Placeholder, ideally specific ID
              email: email,
              tokens: tokens, // Pass tokens to jwt callback
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
