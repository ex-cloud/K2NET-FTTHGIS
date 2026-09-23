import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function TeamPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["team.view", "team.manage"]}
      fallback={
        <TenantAccessDenied
          title="Akses Manajemen Tim Dibatasi"
          description="Hanya Administrator atau Owner organisasi yang dapat mengelola anggota dan pembagian peran tim."
          requiredPermission="team.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
