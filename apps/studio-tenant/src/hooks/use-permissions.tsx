import { type ReactNode, useEffect, useState } from "react";
import { useAuth } from "@k2net/auth/client";

/**
 * Hook to access tenant-scoped PBAC permission checking utilities in studio-tenant.
 *
 * - `canAccess(code)`: Returns true if the current tenant user has the given permission code (or any if array passed).
 *   - Organization Owners & Tenant Admins (roles: `tenant_admin`, `owner`, `admin`) bypass all tenant permission checks.
 *   - Other roles (operator, technician, finance, viewer) are checked against dynamic permissions.
 * - `isOwner`: Quick check if the current user is an organization owner or tenant admin.
 * - `permissions`: The active list of permission codes assigned to the user.
 * - `isLoading`: True while auth initialization or profile is loading.
 */
export function usePermissions() {
  const { user, authenticated, initialized, token } = useAuth();
  const isLoading = !initialized;

  const roles: string[] = (user?.roles ?? []).map((r) =>
    r.toLowerCase().replace(/^role_/, "")
  );

  const isOwner =
    roles.includes("owner") ||
    roles.includes("tenant_admin") ||
    roles.includes("admin") ||
    roles.includes("super_admin");

  const [fetchedPermissions, setFetchedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!authenticated || !user?.id || isOwner) return;

    let isMounted = true;
    const fetchUserProfile = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/v1/users/me", { headers });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.permissions)) {
            setFetchedPermissions(data.permissions);
          }
        }
      } catch (err) {
        console.warn("[usePermissions] Failed to fetch /api/v1/users/me:", err);
      }
    };

    fetchUserProfile();
    return () => {
      isMounted = false;
    };
  }, [authenticated, user?.id, token, isOwner]);

  const activePermissions: string[] = isOwner
    ? [
        "projects.view",
        "projects.create",
        "projects.edit",
        "projects.delete",
        "network.view",
        "network.manage",
        "network.edit",
        "inventory.view",
        "inventory.manage",
        "subscribers.view",
        "subscribers.manage",
        "issues.view",
        "issues.manage",
        "team.view",
        "team.manage",
        "billing.view",
        "billing.manage",
        "settings.view",
        "settings.manage",
        "gis.view",
        "gis.manage",
      ]
    : fetchedPermissions;

  /**
   * Check if current user can access a given permission code or array of codes.
   */
  function canAccess(permissionCode?: string | string[]): boolean {
    if (!permissionCode) return true;
    if (!authenticated) return false;
    if (isOwner) return true;

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
    if (isOwner) return true;
    return roleNames.some((r) => roles.includes(r.toLowerCase().replace(/^role_/, "")));
  }

  return {
    canAccess,
    hasRole,
    isOwner,
    permissions: activePermissions,
    roles,
    isLoading,
    user,
    authenticated,
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
