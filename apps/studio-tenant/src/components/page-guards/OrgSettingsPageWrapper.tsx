import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function OrgSettingsPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["organizations.view", "organizations.update"]}
      fallback={
        <TenantAccessDenied
          title="Akses Pengaturan Organisasi Dibatasi"
          description="Anda memerlukan izin administratif untuk mengubah profil organisasi, domain kustom, autentikasi SSO, dan audit trail."
          requiredPermission="organizations.update"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
