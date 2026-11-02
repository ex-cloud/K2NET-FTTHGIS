export type TenantUserRole =
  | "TENANT_ADMIN"
  | "NOC_OPERATOR"
  | "FIELD_TECH"
  | "SURVEYOR"
  | "SUPERVISOR"
  | "WAREHOUSE"
  | "FINANCE"
  | "HELPDESK"
  | "VIEWER"
  | string;

export type TenantUserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | string;

export interface TenantUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: TenantUserRole;
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
  status?: string;
  lastLogin?: string;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  mfaEnabled?: boolean;
  timezone?: string;
  source?: string;
}
