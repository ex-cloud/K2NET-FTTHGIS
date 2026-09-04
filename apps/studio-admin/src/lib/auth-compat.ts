import { useAuth, type KeycloakLoginOptions, type KeycloakLogoutOptions } from "@k2net/auth/client";

// Extended user type to match all usages across studio-admin
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenantId: string;
  organizationId: string;
  // Optional extended fields (may be present in Keycloak token claims)
  username?: string;
  avatar_url?: string;
  organizationSlug?: string;
  issuer?: string;
  permissions?: string[];
}

export interface AdminSession {
  user: AdminUser;
  accessToken: string | null;
}

export interface UseSessionReturn {
  data: AdminSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (provider?: string, options?: KeycloakLoginOptions) => Promise<void>;
  signOut: (options?: KeycloakLogoutOptions) => Promise<void>;
  update: () => Promise<void>;
}

import { useMemo, useCallback } from "react";

export function useSession(): UseSessionReturn {
  const { user, authenticated, initialized, login, logout, token } = useAuth();

  const adminUser: AdminUser | undefined = useMemo(() => {
    if (!user) return undefined;
    return {
      id: user.id || "",
      name: user.name || user.username || "Admin",
      email: user.email || "",
      roles: user.roles || [],
      tenantId: user.tenantId || "",
      organizationId: user.organizationId || user.tenantId || "",
      username: user.username || user.email || "",
      avatar_url: user.avatarUrl,
      organizationSlug: user.organizationSlug || user.tenantSlug || user.tenantId,
      issuer: user.issuer,
      permissions: user.permissions || [],
    };
  }, [user]);

  const sessionData = useMemo(() => {
    if (!authenticated || !adminUser) return null;
    return {
      user: adminUser,
      accessToken: token ?? null,
    };
  }, [authenticated, adminUser, token]);

  const signIn = useCallback(async (_provider?: string, options?: KeycloakLoginOptions) => {
    await login(options);
  }, [login]);

  const signOut = useCallback(async (options?: KeycloakLogoutOptions) => {
    await logout(options);
  }, [logout]);

  const update = useCallback(async () => {
    // no-op: token refresh is handled automatically by Keycloak adapter
  }, []);

  return {
    data: sessionData,
    status: !initialized
      ? "loading"
      : authenticated
      ? "authenticated"
      : "unauthenticated",
    signIn,
    signOut,
    update,
  };
}

/** Standalone signIn – for use outside React components */
export function signIn(_provider?: string, options?: KeycloakLoginOptions) {
  const auth = typeof window !== "undefined" ? window.__K2NET_AUTH__ : undefined;
  if (auth?.login) {
    auth.login(options);
  } else {
    window.location.href = "/";
  }
}

/** Standalone signOut – for use outside React components */
export function signOut(options?: KeycloakLogoutOptions) {
  const auth = typeof window !== "undefined" ? window.__K2NET_AUTH__ : undefined;
  if (auth?.logout) {
    auth.logout(options);
  } else {
    window.location.href = "/";
  }
}
