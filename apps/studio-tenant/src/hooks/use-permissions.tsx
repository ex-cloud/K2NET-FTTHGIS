import { type ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@k2net/auth/client";
import { useImpersonationSession } from "../lib/useImpersonationSession";
import { getApiAuthToken } from "../lib/api-client";

/**
 * Hook to access tenant-scoped PBAC permission checking utilities in studio-tenant.
 *
 * - Server-Authoritative: Fetches dynamic permissions directly from `/api/v1/users/me`
 *   with `X-Impersonation-Session-Id` during support assistance sessions.
 * - `canAccess(code)`: Returns true if the active user (or impersonator) has the given permission code.
 * - `isOwner`: True for direct tenant Organization Owners & Tenant Admins.
 * - `permissions`: The active list of permission codes verified by the server.
 */
export function usePermissions() {
  const { user, authenticated, initialized, token: kcToken } = useAuth();
  const { isImpersonating, sessionId, refreshPermissionsTrigger } = useImpersonationSession();

  const roles: string[] = (user?.roles ?? []).map((r) =>
    r.toLowerCase().replace(/^role_/, "")
  );

  // Direct tenant owner/admin bypass (only applies to actual tenant credentials, NOT client-dictated impersonation)
  const isDirectTenantOwner =
    !isImpersonating &&
    (roles.includes("owner") ||
      roles.includes("tenant_admin") ||
      roles.includes("admin"));

  const [fetchedPermissions, setFetchedPermissions] = useState<string[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const lastFetchedKeyRef = useRef<string>("");

  const fetchUserProfile = useCallback(async () => {
    const activeToken = getApiAuthToken() || kcToken;
    if (!activeToken && !authenticated && !isImpersonating) return;

    setIsProfileLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }
      if (sessionId) {
        headers["X-Impersonation-Session-Id"] = sessionId;
      }

      const res = await fetch("/api/v1/users/me", { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.permissions)) {
          setFetchedPermissions(data.permissions);
        }
      } else if (res.status === 401 || res.status === 403) {
        // Server revoked or rejected session
        setFetchedPermissions([]);
      }
    } catch (err) {
      console.warn("[usePermissions] Failed to fetch /api/v1/users/me:", err);
    } finally {
      setIsProfileLoading(false);
    }
  }, [kcToken, authenticated, isImpersonating, sessionId]);

  useEffect(() => {
    // If not authenticated and not impersonating, reset
    if (!authenticated && !isImpersonating) {
      setFetchedPermissions([]);
      lastFetchedKeyRef.current = "";
      return;
    }

    const currentKey = `${authenticated ? user?.id : ""}_${sessionId || ""}_${refreshPermissionsTrigger}`;
    if (lastFetchedKeyRef.current === currentKey) return;
    lastFetchedKeyRef.current = currentKey;

    fetchUserProfile();
  }, [authenticated, user?.id, isImpersonating, sessionId, refreshPermissionsTrigger, fetchUserProfile]);

  const activePermissions: string[] = isDirectTenantOwner
    ? [
        "projects.view",
        "projects.create",
        "projects.edit",
        "projects.delete",
        "projects.export",
        "network.view",
        "network.manage",
        "network.edit",
        "network.nodes",
        "network.audit",
        "inventory.view",
        "inventory.manage",
        "inventory.report",
        "subscribers.view",
        "subscribers.manage",
        "issues.view",
        "issues.manage",
        "team.view",
        "team.manage",
        "team.invite",
        "billing.view",
        "billing.manage",
        "settings.view",
        "settings.manage",
        "roles.view",
        "roles.update",
        "users.view",
        "users.manage",
        "organizations.view",
        "organizations.update",
        "gis.view",
        "gis.manage",
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

  const isLoading = (!initialized && !isImpersonating) || (isImpersonating && isProfileLoading && fetchedPermissions.length === 0);

  return {
    canAccess,
    hasRole,
    isOwner: isDirectTenantOwner,
    permissions: activePermissions,
    roles,
    isLoading,
    user,
    authenticated: authenticated || isImpersonating,
    refetchPermissions: fetchUserProfile,
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

  if (isLoading) return null;
  if (!canAccess(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
