import { type ReactNode } from "react";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";
import { ModuleStatusGuard } from "./ModuleStatusGuard";

export function ProjectsPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <ModuleStatusGuard moduleKey="projects">
      <PermissionGuard
        permission={["projects.view", "projects.create", "projects.edit"]}
        fallback={
          <TenantAccessDenied
            title={t("security.access_denied")}
            description={t("security.access_denied_projects")}
            requiredPermission="projects.view"
          />
        }
      >
        {children}
      </PermissionGuard>
    </ModuleStatusGuard>
  );
}
