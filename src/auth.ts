import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { JWT } from "next-auth/jwt";

interface KeycloakIdTokenPayload {
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
  picture?: string;
  avatar_url?: string;
}

type ExtendedUser = import("next-auth").User & {
  username?: string | null;
  preferred_username?: string;
  avatar_url?: string | null;
};

async function refreshAccessToken(token: JWT) {
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
      refreshToken: tokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token if new one not sent
      idToken: tokens.id_token ?? token.idToken, // Update ID token if new one is sent
    };
  } catch (error) {
    console.error("Error refreshing Access Token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError" as const,
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
          let profile: KeycloakIdTokenPayload = {};
          try {
            const idToken = userWithTokens.tokens.id_token;
            const payload: KeycloakIdTokenPayload = JSON.parse(
              Buffer.from(idToken.split(".")[1], "base64").toString(),
            );
            profile = payload;
          } catch (e) {
            console.error("Failed to decode ID Token", e);
          }

          const exUser = user as ExtendedUser;
          const enrichedUser = {
            id: user.id || token.sub,
            email: profile.email || exUser.email || token.email,
            name: profile.name || exUser.name || token.name,
            avatar_url:
              profile.avatar_url ||
              profile.picture ||
              exUser.avatar_url ||
              exUser.image,
            username:
              profile.preferred_username ||
              exUser.username ||
              exUser.preferred_username,
          };

          return {
            ...token,
            accessToken: userWithTokens.tokens.access_token,
            refreshToken: userWithTokens.tokens.refresh_token,
            idToken: userWithTokens.tokens.id_token,
            expiresAt: Math.floor(
              Date.now() / 1000 + userWithTokens.tokens.expires_in,
            ),
            user: enrichedUser,
          };
        }

        // Handle OAuth provider (Keycloak redirect flow - account exists)
        if (account) {
          const exUser = user as ExtendedUser;
          token.user = {
            ...user,
            avatar_url: exUser.avatar_url || exUser.image,
            username: exUser.preferred_username || exUser.username,
          };
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            expiresAt: account.expires_at,
          };
        }
      }

      // 2. Return previous token if the access token has not expired yet
      // buffer time 15s (increased from 10s)
      const isExpired = Date.now() > (token.expiresAt as number) * 1000 - 15000;
      if (!isExpired) {
        return token;
      }

      // 3. Access token has expired, try to update it
      const refreshedToken = await refreshAccessToken(token);
      
      // SAFETY: If refresh fails, keep the old token for one more cycle 
      // instead of returning an error that triggers immediate signout
      if (refreshedToken.error === "RefreshAccessTokenError") {
        return token; 
      }

      return refreshedToken;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.idToken) {
        session.idToken = token.idToken as string;
      }
      if (token.error) {
        session.error = token.error as "RefreshAccessTokenError";
      }
      if (session.user && token.user) {
        // Safe transfer of enriched fields from JWT to Session
        const tokenUser = token.user as ExtendedUser;
        session.user = {
          ...session.user,
          id: tokenUser.id || session.user.id,
          email: tokenUser.email || session.user.email,
          name: tokenUser.name || session.user.name,
          username: tokenUser.username || session.user.username,
          avatar_url: tokenUser.avatar_url || session.user.avatar_url,
        };
      }
      return session;
    },
  },
});
