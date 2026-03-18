import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    error?: "RefreshAccessTokenError";
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      username?: string | null;
      avatar_url?: string | null;
    } & import("next-auth").DefaultSession["user"];
  }

  interface User {
    username?: string | null;
    avatar_url?: string | null;
    tokens?: {
      access_token: string;
      refresh_token: string;
      id_token: string;
      expires_in: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: "RefreshAccessTokenError";
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      username?: string | null;
      avatar_url?: string | null;
    };
  }
}
