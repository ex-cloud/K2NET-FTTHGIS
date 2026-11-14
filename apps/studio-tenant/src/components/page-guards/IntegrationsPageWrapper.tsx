import { type ReactNode } from "react";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function IntegrationsPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["organizations.webhooks.manage", "feature.integration.open_api", "organizations.update"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_integrations")}
          requiredPermission="organizations.webhooks.manage"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
