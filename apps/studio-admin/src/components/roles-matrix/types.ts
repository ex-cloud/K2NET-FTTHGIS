export interface Permission {
  id: number;
  code: string;
  description: string;
  module: string;
}

export interface Role {
  id: number;
  name: string;
  code?: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  permissions: Permission[];
  scope?: "SYSTEM" | "TENANT";
}

export interface RoleUserCount {
  roleId: number;
  roleName: string;
  activeUserCount: number;
  totalUserCount: number;
}

export interface ImpactData {
  roles: Role[];
  userCounts: Record<number, RoleUserCount>;
  revocations: Record<number, Permission[]>;
  isBatch: boolean;
}

export interface RolesMatrixUIProps {
  context: "system" | "tenant";
}
