export interface DynamicRole {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  scope: string;
  code?: string;
  isSystemRole?: boolean;
}

export type TenantUserRole = string;

export type TenantUserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | string;

export interface TenantUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: string;
  roleDisplayName?: string;
  roleId?: number;
  roleCode?: string;
  mfaEnabled: boolean;
  status: TenantUserStatus;
  lastLogin: string;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  timezone?: string;
  source?: string;
}

export interface RawServerTenantUser {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  role?: string;
  roleId?: number;
  roleName?: string;
  roleDisplayName?: string;
  roleCode?: string;
  status?: string;
  lastLogin?: string;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  mfaEnabled?: boolean;
  timezone?: string;
  source?: string;
}
