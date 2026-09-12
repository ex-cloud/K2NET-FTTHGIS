import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import type { Role, Permission, RoleUserCount } from "./types";

export async function fetchRolesAndPermissions(
  scope: "SYSTEM" | "TENANT",
  token: string,
  userRoles: string[]
): Promise<{ roles: Role[]; permissions: Permission[] }> {
  const baseUrl = getBackendBaseUrl();
  const [rolesRes, permsRes] = await Promise.all([
    httpClient(`${baseUrl}/roles?scope=${scope}`, { token }),
    httpClient(`${baseUrl}/roles/permissions?scope=${scope}`, { token }),
  ]);

  if (!rolesRes.ok || !permsRes.ok) throw new Error("Failed to fetch data");

  let rolesData: Role[] = await rolesRes.json();
  const permsData: Permission[] = await permsRes.json();

  const isSystemAdmin = userRoles.includes("super_admin");
  if (!isSystemAdmin) {
    rolesData = rolesData.filter((r) => r.name.toLowerCase() !== "super_admin");
  }

  return { roles: rolesData, permissions: permsData };
}

export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[],
  token: string
): Promise<void> {
  const baseUrl = getBackendBaseUrl();
  const res = await httpClient(`${baseUrl}/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify(permissionIds),
    token,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Failed to update" }));
    throw new Error(errorData.message || "Failed to update permissions");
  }
}

export async function fetchRoleUserCount(
  roleId: number,
  token: string
): Promise<RoleUserCount | null> {
  try {
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/roles/${roleId}/user-count`, { token });
    if (res.ok) {
      return (await res.json()) as RoleUserCount;
    }
  } catch (err) {
    console.warn("User count check error:", err);
  }
  return null;
}
