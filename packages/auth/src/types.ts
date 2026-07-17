/**
 * @k2net/auth — NextAuth Module Augmentation
 * Extends the default NextAuth types to include K2NET-specific fields
 * (roles, permissions, avatar_url, username, organizationSlug).
 *
 * Import this file in your app's auth.ts to ensure TypeScript picks up these types.
 */
import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    username?: string | null;
    preferred_username?: string;
    avatar_url?: string | null;
    roles?: string[];
    permissions?: string[];
    organizationSlug?: string | null;
  }

  interface Session extends DefaultSession {
    accessToken?: string;
    idToken?: string;
    issuer?: string;
    error?: "RefreshAccessTokenError";
    user: {
      username?: string | null;
      avatar_url?: string | null;
      roles?: string[];
      permissions?: string[];
      organizationSlug?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    issuer?: string;
    expiresAt?: number;
    issuedAt?: number;
    user?: import("next-auth").User;
    permissions?: string[];
    error?: "RefreshAccessTokenError";
  }
}

export {};
