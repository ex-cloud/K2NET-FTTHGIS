import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";
import { useTranslation } from "@k2net/i18n";

export function ProjectSettingsPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["projects.edit", "projects.create", "projects.view"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_settings")}
          requiredPermission="projects.edit"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
