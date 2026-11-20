import { buildPlatformPermissionCategories } from "./user-management-platform-permissions";
import { buildTenantPermissionCategories } from "./user-management-tenant-permissions";

export { buildPlatformPermissionCategories } from "./user-management-platform-permissions";
export { buildTenantPermissionCategories } from "./user-management-tenant-permissions";

export interface UnifiedUserMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  roleName: string;
  status: string;
  isDefault: boolean;
  joinedAt?: string;
}

export interface UnifiedUserProjectRole {
  projectId: string;
  projectName: string;
  roleName: string;
  roleDisplayName: string;
}

export type UnifiedUserScope = "platform" | "tenant";

export type UnifiedTranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string;

export interface UnifiedRolePermissionItem {
  id?: number;
  code: string;
  name?: string;
  module?: string;
}

export interface UnifiedRoleOption {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  code?: string;
  scope?: string;
  isSystemRole?: boolean;
  isTemplate?: boolean;
  permissions?: Array<UnifiedRolePermissionItem | string>;
}

export interface UnifiedProjectOption {
  id: string;
  name: string;
}

export interface UnifiedUserRecord {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  status: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  roleId?: number | null;
  roleName?: string;
  roleDisplayName?: string;
  roleCode?: string | null;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  lastLoginAt?: string | null;
  lastLogin?: string | null;
  lastLoginIp?: string | null;
  createdAt?: string;
  memberships?: UnifiedUserMembership[];
  projectRoles?: UnifiedUserProjectRole[];
}

export interface UnifiedInviteSubmitPayload {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  roleId: number | null;
  roleName: string;
  creationMode: "INVITE" | "DIRECT";
  customPassword: string;
  projectId: string;
}

export interface UnifiedEditSubmitPayload {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  roleId: number | null;
  roleName: string;
  status: string;
  projectId: string;
  reason: string;
}

export interface UnifiedResetPasswordPayload {
  userId: string;
  email: string;
  newPassword: string;
  temporary: boolean;
}

export interface PermissionCategoryGroup {
  id: string;
  titleKey: string;
  fallbackTitle: string;
  minPlanTier?: string;
  status?: string;
  items: Array<{
    code: string;
    label: string;
    description: string;
    enabled: boolean;
    minPlanTier?: string;
    status?: string;
  }>;
}

export interface DynamicModuleMeta {
  code: string;
  name: string;
  scope: string;
  category?: string;
  minPlanTier?: string;
  status?: string;
  permissions?: Array<{ code: string; name: string; description?: string }>;
}

export function trKey(
  t: UnifiedTranslateFn | undefined,
  key: string,
  fallback: string,
  params?: Record<string, string | number>
): string {
  if (t) {
    const res = t(key, params);
    if (res && res !== key) {
      return res;
    }
  }
  if (!params) return fallback;
  return Object.entries(params).reduce(
    (acc, [k, v]) =>
      acc
        .replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v))
        .replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    fallback
  );
}

export function generateStrongCryptoPassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const array = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * chars.length);
    }
  }
  let pass = "K2!";
  for (let i = 0; i < length - 3; i++) {
    pass += chars[array[i] % chars.length];
  }
  return pass;
}

const DEFAULT_ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin:
    "Can edit any platform setting, manage all tenant organizations, billing subscriptions, catalog packages, and security roles.",
  system_support:
    "Can assist tenant operations, manage support tickets, inspect diagnostics, and initiate step-up impersonation sessions.",
  account_manager:
    "Can manage tenant subscriptions, invoices, commercial renewals, and organization account profiles.",
  system_auditor:
    "Can view platform-wide immutable audit trails, compliance reports, and security telemetry in read-only mode.",
  admin:
    "Can access the full organization workspace, manage FTTH GIS topology, OLT hardware, billing subscriptions, and team memberships.",
  noc:
    "Can manage FTTH network topology, monitor OLT/ONT telemetry, execute SNMP diagnostics, and handle outage operations.",
  technician:
    "Can access assigned field work orders, inspect ODC/ODP splice closures, update customer drops, and resolve trouble tickets.",
  viewer:
    "Can view organization dashboard, GIS map layers, coverage zones, and inventory in strict read-only mode.",
};

export function resolveRoleDescription(role: UnifiedRoleOption): string {
  if (role.description && role.description.trim().length > 0) {
    return role.description;
  }
  const key = (role.name || "").toLowerCase();
  return (
    DEFAULT_ROLE_DESCRIPTIONS[key] ||
    `Grants operational permissions associated with the ${role.displayName || role.name} role.`
  );
}

export function resolveCanonicalRoleCode(
  roleName?: string,
  roleCode?: string | null,
  scope: UnifiedUserScope = "tenant"
): string {
  if (roleCode && roleCode.trim().length > 0) {
    return roleCode.trim().toUpperCase();
  }
  const clean = (roleName || "").toLowerCase();
  if (clean === "super_admin") return "SYS-01";
  if (clean === "system_support") return "SYS-02";
  if (clean === "account_manager") return "SYS-03";
  if (clean === "system_auditor") return "SYS-04";
  if (clean === "admin" || clean === "tenant_admin") return "TENT-01";
  if (clean === "noc") return "TENT-02";
  if (clean === "technician") return "TENT-03";
  if (clean === "viewer") return "TENT-04";
  return scope === "platform" ? "SYS-ROLE" : "CUST-ROLE";
}

/**
 * Builds permission categories and authority states isolated by scope:
 * - 'platform' delegates strictly to user-management-platform-permissions.ts
 * - 'tenant' delegates strictly to user-management-tenant-permissions.ts
 * Supports Hybrid Dynamic Auto-Discovery when modules metadata is supplied.
 */
export function buildPermissionCategoriesForRole(
  scope: UnifiedUserScope,
  selectedRole: UnifiedRoleOption | null,
  modules?: DynamicModuleMeta[]
): PermissionCategoryGroup[] {
  const baseCategories =
    scope === "platform"
      ? buildPlatformPermissionCategories(selectedRole)
      : buildTenantPermissionCategories(selectedRole);

  if (!modules || modules.length === 0) {
    return baseCategories;
  }

  const moduleMap = new Map<string, DynamicModuleMeta>();
  for (const m of modules) {
    moduleMap.set(m.code.toLowerCase(), m);
  }

  return baseCategories.map((cat) => {
    const matchingModule =
      moduleMap.get(cat.id.toLowerCase()) ||
      moduleMap.get(cat.id.split("_")[0]?.toLowerCase());

    const enrichedItems = cat.items.map((item) => {
      const prefix = item.code.split(".")[0]?.toLowerCase();
      const itemMod = moduleMap.get(prefix) || matchingModule;
      return {
        ...item,
        minPlanTier: itemMod?.minPlanTier || item.minPlanTier,
        status: itemMod?.status || item.status,
      };
    });

    return {
      ...cat,
      minPlanTier: matchingModule?.minPlanTier || cat.minPlanTier,
      status: matchingModule?.status || cat.status,
      items: enrichedItems,
    };
  });
}
