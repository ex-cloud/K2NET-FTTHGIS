import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // return Response.redirect(new URL("/dashboard", nextUrl)); // Optional: Auto redirect to dashboard
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // 1. First Login - Handle both OAuth and Credentials
      if (account && user) {
        // Check if tokens come from Credentials provider (embedded in user object)
        const userWithTokens = user as {
          tokens?: {
            access_token: string;
            refresh_token: string;
            expires_in: number;
          };
        };

        if (userWithTokens.tokens) {
          // Credentials provider: tokens are in user object
          return {
            ...token,
            accessToken: userWithTokens.tokens.access_token,
            refreshToken: userWithTokens.tokens.refresh_token,
            expiresAt: Math.floor(
              Date.now() / 1000 + userWithTokens.tokens.expires_in,
            ),
            user: { id: user.id, email: user.email, name: user.name },
          };
        }

        // OAuth provider (Keycloak redirect flow)
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          user: user,
        };
      }

      // 2. Return previous token if the access token has not expired yet
      // buffer time 10s
      if (Date.now() < (token.expiresAt as number) * 1000 - 10000) {
        return token;
      }

      // 3. Access token has expired, try to update it
      console.log("Access Token expired, refreshing...");
      try {
        const response = await fetch(
          `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

        if (!response.ok) throw tokens;

        return {
          ...token,
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          refreshToken: tokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
        };
      } catch (error) {
        console.error("Error refreshing Access Token", error);
        return { ...token, error: "RefreshAccessTokenError" as const };
      }
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.error) {
        session.error = token.error as "RefreshAccessTokenError";
      }
      return session;
    },
  },
});
