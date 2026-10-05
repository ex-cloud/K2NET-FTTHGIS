import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";
import { useTranslation } from "@k2net/i18n";

export function AuditLogsPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["organization.audit.view", "organizations.view"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_audit")}
          requiredPermission="organization.audit.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
