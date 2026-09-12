export type TenantUserRole = "TENANT_ADMIN" | "NOC_OPERATOR" | "FIELD_TECH" | "VIEWER";
export type TenantUserStatus = "ACTIVE" | "PENDING";

export interface TenantUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: TenantUserRole;
  mfaEnabled: boolean;
  status: TenantUserStatus;
  lastLogin: string;
  source?: string;
}

export interface RawServerTenantUser {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
  lastLogin?: string;
  source?: string;
}
