import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function InventoryPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["inventory.view", "network.view"]}
      fallback={
        <TenantAccessDenied
          title="Akses Inventaris FTTH Dibatasi"
          description="Anda memerlukan hak akses inventaris untuk melihat aset ODC, ODP, kabel bentang, dan generator BoQ."
          requiredPermission="inventory.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
