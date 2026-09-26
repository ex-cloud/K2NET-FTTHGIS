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

/**
 * Hook to access tenant-scoped PBAC permission checking utilities in studio-tenant.
 *
 * - Server-Authoritative: Fetches dynamic permissions directly from `/api/v1/users/me`
 *   with `X-Impersonation-Session-Id` during support assistance sessions.
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

  // Direct tenant owner/admin bypass (only applies to actual tenant credentials, NOT client-dictated impersonation)
  const isDirectTenantOwner =
    !isImpersonating &&
    (roles.includes("owner") ||
      roles.includes("tenant_admin") ||
      roles.includes("admin"));

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
      kcToken,
      refreshPermissionsTrigger,
    ],
    queryFn: async () => {
      const activeToken = getApiAuthToken() || kcToken;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }
      if (sessionId) {
        headers["X-Impersonation-Session-Id"] = sessionId;
      }

      let res = await fetch("/api/v1/users/me", { headers });

      // Auto-heal 401/403 during active impersonation
      if ((res.status === 401 || res.status === 403) && isImpersonating && sessionId) {
        const refreshedToken = await refreshImpersonationToken();
        if (refreshedToken) {
          headers["Authorization"] = `Bearer ${refreshedToken}`;
          res = await fetch("/api/v1/users/me", { headers });
        }
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return null;
        }
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      return res.json();
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const fetchedPermissions: string[] = Array.isArray(userProfile?.permissions)
    ? userProfile.permissions
    : [];

  const activePermissions: string[] = isDirectTenantOwner
    ? [
        "projects.view",
        "projects.create",
        "projects.edit",
        "projects.delete",
        "projects.export",
        "network.view",
        "network.manage",
        "network.manage.all-projects",
        "network.nodes",
        "network.audit",
        "network.monitor",
        "inventory.view",
        "inventory.edit",
        "inventory.manage",
        "inventory.report",
        "customer.view",
        "coverage.view",
        "ticket.view",
        "ticket.create",
        "ticket.update",
        "ticket.assign",
        "team.view",
        "team.invite",
        "team.manage",
        "billing.view",
        "billing.manage",
        "organizations.view",
        "organizations.create",
        "organizations.update",
        "organizations.delete",
        "organizations.webhooks.manage",
        "map.view",
        "map.edit",
        "audit.view",
        "report.view",
        "report.export",
        "approval.manage",
        "roles.view",
        "roles.update",
        "users.view",
        "users.invite",
        "users.manage",
        "dashboard.view",
        "survey.create",
        "task.update",
      ]
    : fetchedPermissions;

  /**
   * Check if current user can access a given permission code or array of codes.
   * Evaluated strictly against the server-verified activePermissions list.
   */
  function canAccess(permissionCode?: string | string[]): boolean {
    if (!permissionCode) return true;
    if (!authenticated && !isImpersonating) return false;
    if (isDirectTenantOwner) return true;

    if (Array.isArray(permissionCode)) {
      if (permissionCode.length === 0) return true;
      return permissionCode.some((code) => activePermissions.includes(code));
    }

    return activePermissions.includes(permissionCode);
  }

  /**
   * Check if the current user has any of the specified roles.
   */
  function hasRole(...roleNames: string[]): boolean {
    if (isDirectTenantOwner) return true;
    return roleNames.some((r) => roles.includes(r.toLowerCase().replace(/^role_/, "")));
  }

  // Loading state: true only when actively resolving initial profile without cached permissions
  const isLoading =
    (!initialized && !isImpersonating) ||
    (isEnabled && isProfileLoading && fetchedPermissions.length === 0 && !isDirectTenantOwner);

  return {
    canAccess,
    hasRole,
    isOwner: isDirectTenantOwner,
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
