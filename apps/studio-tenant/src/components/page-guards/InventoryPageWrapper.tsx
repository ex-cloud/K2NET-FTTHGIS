import { type ReactNode } from "react";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function InventoryPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["inventory.view", "inventory.edit", "inventory.manage", "network.view"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_inventory")}
          requiredPermission="inventory.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
