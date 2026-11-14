import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";
import { useTranslation } from "@k2net/i18n";

export function ProjectAuditLogsPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["audit.view", "project.audit.view", "network.audit"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_audit")}
          requiredPermission="audit.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
