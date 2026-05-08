import NextAuth, { DefaultSession } from "next-auth";
import authConfig from "./auth.config";
import { JWT as NextAuthJWT } from "next-auth/jwt";

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
    user?: import("next-auth").User;
  }
}

async function refreshAccessToken(token: NextAuthJWT) {
  try {
    // Dynamic Issuer: Use the issuer stored in the token if available, otherwise fallback to env
    const issuer = (token.issuer as string) || process.env.AUTH_KEYCLOAK_ISSUER;
    
    logInfo(`Refreshing token for user ${token.email} using issuer: ${issuer}`);

    const response = await fetch(
      `${issuer}/protocol/openid-connect/token`,
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
            roles = payload.realm_access?.roles || [];
          } catch (e) {
            console.error("Failed to decode Access Token roles in Credentials flow", e);
          }

          const exUser = user as import("next-auth").User;
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
            roles: roles,
          };

          logInfo(`🔑 Login via Credentials. Issuer extracted from ID token: ${profile.iss}`);

          return {
            ...token,
            accessToken: userWithTokens.tokens.access_token,
            refreshToken: userWithTokens.tokens.refresh_token,
            idToken: userWithTokens.tokens.id_token,
            issuer: profile.iss, // Store issuer for dynamic refresh!
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
              roles = payload.realm_access?.roles || [];
            } catch (e) {
              console.error("Failed to decode Access Token roles", e);
            }
          }

          token.user = {
            ...user,
            avatar_url: exUser.avatar_url || exUser.image,
            username: exUser.preferred_username || exUser.username,
            roles: roles,
          };
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            issuer: issuer, // Store issuer for dynamic refresh!
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
      if (token.issuer) {
        session.issuer = token.issuer as string;
      }
      if (session.user && token.user) {
        // Safe transfer of enriched fields from JWT to Session
        const tokenUser = token.user as import("next-auth").User;
        session.user = {
          ...session.user,
          id: tokenUser.id || session.user.id,
          email: tokenUser.email || session.user.email,
          name: tokenUser.name || session.user.name,
          username: tokenUser.username || session.user.username,
          avatar_url: tokenUser.avatar_url || session.user.avatar_url,
          roles: tokenUser.roles || [],
        };
      }
      return session;
    },
  },
});
