import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function SubscribersPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["customer.view", "network.view"]}
      fallback={
        <TenantAccessDenied
          title="Akses Data Pelanggan Dibatasi"
          description="Anda tidak memiliki izin untuk melihat database pelanggan, status ONT/ONU, dan sesi PPPoE."
          requiredPermission="customer.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
