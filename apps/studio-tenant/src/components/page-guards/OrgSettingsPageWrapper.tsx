import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";
import { useTranslation } from "@k2net/i18n";

export function OrgSettingsPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["organizations.view", "organizations.update"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_settings")}
          requiredPermission="organizations.update"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
