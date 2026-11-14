import { type ReactNode } from "react";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function SubscribersPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["customer.view", "users.view", "roles.view"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_customers")}
          requiredPermission="customer.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
