

import { useSession } from "@/lib/auth-compat";
import type { ReactNode } from "react";

/**
 * Hook to access permission checking utilities.
 *
 * - `canAccess(code)`: Returns true if the current user has the given permission code.
 *   - Super admins (role: `super_admin`) bypass ALL permission checks (always return true).
 *   - Other users are checked against `session.user.permissions`.
 * - `isSuperAdmin`: Quick check if the current user has the super_admin role.
 * - `permissions`: The raw list of permission codes assigned to the user.
 * - `isLoading`: True while the session is being fetched.
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const roles: string[] = session?.user?.roles ?? [];
  const permissions: string[] = session?.user?.permissions ?? [];
  const isSuperAdmin = roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");

  /**
   * Check if the current user can access a given permission code.
   * Super admins always return `true`.
   */
  function canAccess(permissionCode: string): boolean {
    if (!session) return false;
    if (isSuperAdmin) return true;
    return permissions.includes(permissionCode);
  }

  /**
   * Check if the current user has any of the given roles.
   */
  function hasRole(...roleNames: string[]): boolean {
    return roleNames.some((r) => roles.includes(r));
  }

  return {
    canAccess,
    hasRole,
    isSuperAdmin,
    permissions,
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
 * <PermissionGuard permission="nodes.create">
 *   <CreateNodeButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canAccess, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!canAccess(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
