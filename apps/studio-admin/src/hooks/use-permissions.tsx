

"use client";

import { useSession } from "@/lib/auth-compat";
import { type ReactNode, useEffect, useState } from "react";

/**
 * Hook to access permission checking utilities.
 *
 * - `canAccess(code)`: Returns true if the current user has the given permission code (or any code if an array is passed).
 *   - Super admins (role: `super_admin` / `ROLE_SUPER_ADMIN`) bypass ALL permission checks (always return true).
 *   - Other users are checked against `session.user.permissions` or dynamically fetched permissions from `/api/v1/users/me`.
 * - `isSuperAdmin`: Quick check if the current user has the super_admin role.
 * - `permissions`: The active list of permission codes assigned to the user.
 * - `isLoading`: True while the session is being fetched.
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const roles: string[] = session?.user?.roles ?? [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");

  const [fetchedPermissions, setFetchedPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Super admins bypass all checks, no need to fetch
    if (!session?.user?.id || isSuperAdmin) return;

    // If session already contains permissions from token, use them
    if (session?.user?.permissions && session.user.permissions.length > 0) {
      setFetchedPermissions(session.user.permissions);
      return;
    }

    // Otherwise fetch dynamic union permissions from /api/v1/users/me
    let isMounted = true;
    const fetchUserProfile = async () => {
      try {
        const token = session?.accessToken;
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
  }, [session?.user?.id, session?.accessToken, isSuperAdmin, session?.user?.permissions]);

  const activePermissions: string[] =
    session?.user?.permissions && session.user.permissions.length > 0
      ? session.user.permissions
      : fetchedPermissions;

  /**
   * Check if the current user can access a given permission code or list of codes.
   * If permissionCode is undefined/null/empty, returns true.
   * If permissionCode is an array, returns true if user has AT LEAST ONE matching permission.
   * Super admins always return `true`.
   */
  function canAccess(permissionCode?: string | string[]): boolean {
    if (!permissionCode) return true;
    if (!session) return false;
    if (isSuperAdmin) return true;

    if (Array.isArray(permissionCode)) {
      if (permissionCode.length === 0) return true;
      return permissionCode.some((code) => activePermissions.includes(code));
    }

    return activePermissions.includes(permissionCode);
  }

  /**
   * Check if the current user has any of the given roles.
   */
  function hasRole(...roleNames: string[]): boolean {
    if (isSuperAdmin) return true;
    return roleNames.some((r) => roles.includes(r));
  }

  return {
    canAccess,
    hasRole,
    isSuperAdmin,
    permissions: activePermissions,
    roles,
    isLoading,
    session,
  };
}

/**
 * Component that conditionally renders its children based on the user's permissions.
 * If the user does not have the required permission, renders `fallback` (or nothing).
 *
 * @example
 * <PermissionGuard permission="system.gateway.manage">
 *   <SaveEnvButton />
 * </PermissionGuard>
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

