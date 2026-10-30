import { type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@k2net/auth/client";
import { useImpersonationSession } from "../lib/useImpersonationSession";
import { getApiAuthToken, refreshImpersonationToken } from "../lib/api-client";

interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  organizationName?: string;
  organizationSlug?: string;
  organizationId?: string;
  permissions: string[];
}

async function fetchUserProfile(
  isImpersonating: boolean,
  sessionId: string | null,
  kcToken?: string | null
): Promise<UserProfileResponse | null> {
  // During impersonation, NEVER fall back to kcToken from regular tenant realm
  let activeToken = isImpersonating ? getApiAuthToken() : (getApiAuthToken() || kcToken);
  const headers: Record<string, string> = {};
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  if (sessionId) {
    headers["X-Impersonation-Session-Id"] = sessionId;
  }

  let res = await fetch("/api/v1/users/me", { headers });

  // Auto-heal 401/403: handles BOTH impersonation sessions AND direct tenant logins after standby
  if (res.status === 401 || res.status === 403) {
    if (isImpersonating && sessionId) {
      const refreshedToken = await refreshImpersonationToken();
      if (refreshedToken) {
        headers["Authorization"] = `Bearer ${refreshedToken}`;
        res = await fetch("/api/v1/users/me", { headers });
      }
    } else if (typeof window !== "undefined") {
      const authBridge = (
        window as unknown as {
          __K2NET_AUTH__?: {
            updateToken?: (minValidity?: number) => Promise<boolean>;
            token?: string;
          };
        }
      ).__K2NET_AUTH__;

      if (authBridge?.updateToken) {
        const refreshed = await authBridge.updateToken(30);
        const newToken = authBridge.token || getApiAuthToken();
        if (refreshed && newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          res = await fetch("/api/v1/users/me", { headers });
        }
      }
    }
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return null;
    }
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }
  return res.json();
}

function checkPermissionAccess(
  permissionCode: string | string[] | undefined,
  activePermissions: string[],
  authenticated: boolean,
  isImpersonating: boolean
): boolean {
  if (!permissionCode) return true;
  if (!authenticated && !isImpersonating) return false;

  if (Array.isArray(permissionCode)) {
    if (permissionCode.length === 0) return true;
    return permissionCode.some((code) => activePermissions.includes(code));
  }

  return activePermissions.includes(permissionCode);
}

interface CheckIsLoadingOptions {
  initialized: boolean;
  isImpersonating: boolean;
  sessionId: string | null;
  isEnabled: boolean;
  isProfileLoading: boolean;
  hasFetchedPermissions: boolean;
}

function checkIsLoading(opts: CheckIsLoadingOptions): boolean {
  if (!opts.initialized && !opts.isImpersonating) return true;
  if (opts.isImpersonating && !opts.sessionId) return true;
  return opts.isEnabled && opts.isProfileLoading && !opts.hasFetchedPermissions;
}

/**
 * Hook to access tenant-scoped PBAC permission checking utilities in studio-tenant.
 *
 * - Server-Authoritative: Fetches dynamic permissions directly from `/api/v1/users/me`
 *   with `X-Impersonation-Session-Id` during support assistance sessions.
 * - Single Source of Truth (SSOT): Zero hardcoded client permission arrays. Evaluated
 *   strictly against live database permissions returned by Spring Boot.
 * - Globally Cached: Leverages TanStack Query cache to guarantee instantaneous
 *   permission evaluation across route transitions (zero lock screen flickering).
 * - `canAccess(code)`: Returns true if the active user (or impersonator) has the given permission code.
 * - `isOwner`: True for direct tenant Organization Owners & Tenant Admins.
 * - `permissions`: The active list of permission codes verified by the server.
 */
export function usePermissions() {
  const { user, authenticated, initialized, token: kcToken } = useAuth();
  const { isImpersonating, sessionId, refreshPermissionsTrigger } = useImpersonationSession();
  const queryClient = useQueryClient();

  const roles: string[] = (user?.roles ?? []).map((r) =>
    r.toLowerCase().replace(/^role_/, "")
  );

  const isOwner =
    roles.includes("owner") ||
    roles.includes("tenant_admin") ||
    roles.includes("admin");

  const isEnabled = Boolean(authenticated || (isImpersonating && sessionId));

  const {
    data: userProfile,
    isLoading: isProfileLoading,
    refetch,
  } = useQuery<UserProfileResponse | null>({
    queryKey: [
      "user-profile-pbac",
      authenticated ? user?.id : "anon",
      isImpersonating ? sessionId : "direct",
      refreshPermissionsTrigger,
    ],
    queryFn: () => fetchUserProfile(isImpersonating, sessionId, kcToken),
    enabled: isEnabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    retry: 2,
  });

  const activePermissions: string[] = Array.isArray(userProfile?.permissions)
    ? userProfile.permissions
    : [];

  function canAccess(permissionCode?: string | string[]): boolean {
    return checkPermissionAccess(
      permissionCode,
      activePermissions,
      authenticated,
      isImpersonating
    );
  }

  function hasRole(...roleNames: string[]): boolean {
    return roleNames.some((r) => roles.includes(r.toLowerCase().replace(/^role_/, "")));
  }

  const isLoading = checkIsLoading({
    initialized,
    isImpersonating,
    sessionId,
    isEnabled,
    isProfileLoading,
    hasFetchedPermissions: activePermissions.length > 0,
  });

  return {
    canAccess,
    hasRole,
    isOwner,
    permissions: activePermissions,
    roles,
    isLoading,
    user: userProfile || user,
    authenticated: authenticated || isImpersonating,
    refetchPermissions: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["user-profile-pbac"] });
    },
  };
}

/**
 * Component that conditionally renders its children based on the user's tenant permissions.
 * If the user does not have the required permission, renders `fallback` (or nothing).
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission?: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canAccess, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-mono text-muted-foreground">Memvalidasi izin...</span>
        </div>
      </div>
    );
  }

  if (!canAccess(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
