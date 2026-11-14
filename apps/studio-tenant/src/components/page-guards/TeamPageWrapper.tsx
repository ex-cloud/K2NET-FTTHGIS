import { type ReactNode } from "react";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function TeamPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={[
        "team.view",
        "team.manage",
        "members.view",
        "members.manage",
        "users.view",
        "roles.view",
        "roles.update",
        "roles.manage",
      ]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_team")}
          requiredPermission="team.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
