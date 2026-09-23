import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function GisPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["network.view", "gis.view", "projects.view"]}
      fallback={
        <TenantAccessDenied
          title="Akses GIS Studio Dibatasi"
          description="Anda tidak memiliki hak akses untuk memuat peta topologi spasial, redaman fiber optik, atau canvas CAD."
          requiredPermission="network.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
