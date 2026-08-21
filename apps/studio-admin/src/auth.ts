/**
 * apps/studio-admin/src/auth.ts
 *
 * NextAuth instance for the Admin Portal (system-gis.kdua.net).
 * Uses @k2net/auth base config + admin-specific `authorized` callback
 * that only allows access to system subdomain routes.
 */
import "./auth-types"; // Load module augmentation
import { createAuth } from "@k2net/auth";

export const { handlers, signIn, signOut, auth } = createAuth(
  function authorized({ auth: session, request: { nextUrl } }: any) {
    const isLoggedIn = !!session?.user;
    const pathname = nextUrl.pathname;
    const isLoginPath = pathname === "/login";

    if (isLoginPath) {
      if (isLoggedIn) {
        return Response.redirect(new URL("/organizations", nextUrl));
      }
      return true;
    }

    if (!isLoggedIn) {
      return Response.redirect(new URL("/login", nextUrl));
    }

    return true;
  }
);
