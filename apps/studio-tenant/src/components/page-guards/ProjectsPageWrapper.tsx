import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function ProjectsPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["projects.view", "projects.manage"]}
      fallback={
        <TenantAccessDenied
          title="Akses Modul Proyek Dibatasi"
          description="Anda tidak memiliki izin untuk melihat daftar proyek FTTH dalam organisasi ini."
          requiredPermission="projects.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
