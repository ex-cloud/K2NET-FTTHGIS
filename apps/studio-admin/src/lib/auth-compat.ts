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

export function useSession(): UseSessionReturn {
  const { user, authenticated, initialized, login, logout, token } = useAuth();

  const adminUser: AdminUser | undefined = user
    ? {
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
      }
    : undefined;

  return {
    data: authenticated && adminUser
      ? {
          user: adminUser,
          accessToken: token ?? null,
        }
      : null,
    status: !initialized
      ? "loading"
      : authenticated
      ? "authenticated"
      : "unauthenticated",
    signIn: async (_provider?: string, options?: KeycloakLoginOptions) => {
      await login(options);
    },
    signOut: async (options?: KeycloakLogoutOptions) => {
      await logout(options);
    },
    update: async () => {
      // no-op: token refresh is handled automatically by Keycloak adapter
    },
  };
}

/** Standalone signIn – for use outside React components */
export function signIn(_provider?: string, options?: KeycloakLoginOptions) {
  const auth = typeof window !== "undefined" ? window.__K2NET_AUTH__ : undefined;
  if (auth?.login) {
    auth.login();
  } else {
    window.location.href = "/";
  }
}

/** Standalone signOut – for use outside React components */
export function signOut(options?: KeycloakLogoutOptions) {
  const auth = typeof window !== "undefined" ? window.__K2NET_AUTH__ : undefined;
  if (auth?.logout) {
    auth.logout();
  } else {
    window.location.href = "/";
  }
}
