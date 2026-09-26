import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function ProjectSettingsPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["projects.edit", "projects.create", "projects.view"]}
      fallback={
        <TenantAccessDenied
          title="Akses Pengaturan Proyek Dibatasi"
          description="Hanya administrator proyek yang dapat mengubah parameter geofence, anggota proyek, dan impor data GIS."
          requiredPermission="projects.edit"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
