import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function UsagePageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["billing.view", "billing.manage", "organizations.view", "dashboard.view"]}
      fallback={
        <TenantAccessDenied
          title="Akses Metrik Pemakaian Dibatasi"
          description="Anda tidak memiliki izin untuk melihat rincian konsumsi sumber daya dan kuota organisasi."
          requiredPermission="billing.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
