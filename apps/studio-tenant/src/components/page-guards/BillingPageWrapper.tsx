import { type ReactNode } from "react";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";
import { ModuleStatusGuard } from "./ModuleStatusGuard";

export function BillingPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <ModuleStatusGuard moduleKey="billing">
      <PermissionGuard
        permission={["billing.view", "billing.manage", "billing.packages.view", "billing.packages.subscribe"]}
        fallback={
          <TenantAccessDenied
            title={t("security.access_denied")}
            description={t("security.access_denied_billing")}
            requiredPermission="billing.view"
          />
        }
      >
        {children}
      </PermissionGuard>
    </ModuleStatusGuard>
  );
}
