import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function IntegrationsPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["settings.manage", "integrations.manage"]}
      fallback={
        <TenantAccessDenied
          title="Akses Integrasi Gateway Dibatasi"
          description="Anda memerlukan hak akses pengelola integrasi untuk mengonfigurasi gateway WhatsApp, SMS, Webhooks, dan Object Storage."
          requiredPermission="settings.manage"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
