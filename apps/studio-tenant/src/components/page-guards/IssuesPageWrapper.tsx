import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function IssuesPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["issues.view", "issues.manage", "network.view"]}
      fallback={
        <TenantAccessDenied
          title="Akses Tiket Gangguan Dibatasi"
          description="Anda memerlukan hak akses troubleshooting untuk melihat tiket gangguan jaringan dan dispatcher lapangan."
          requiredPermission="issues.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
