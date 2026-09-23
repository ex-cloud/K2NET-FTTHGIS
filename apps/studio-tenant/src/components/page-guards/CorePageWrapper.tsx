import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function CorePageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["network.view", "network.manage"]}
      fallback={
        <TenantAccessDenied
          title="Akses Infrastruktur Core Dibatasi"
          description="Hanya teknisi senior atau network engineer yang memiliki akses ke telemetri OLT, router core, dan server poller."
          requiredPermission="network.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
