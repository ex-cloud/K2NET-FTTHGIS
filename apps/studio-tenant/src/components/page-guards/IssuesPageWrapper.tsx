import { type ReactNode } from "react";
import { useTranslation } from "@k2net/i18n";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function IssuesPageWrapper({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <PermissionGuard
      permission={["ticket.view", "ticket.create", "ticket.update", "ticket.assign", "task.update"]}
      fallback={
        <TenantAccessDenied
          title={t("security.access_denied")}
          description={t("security.access_denied_tickets")}
          requiredPermission="ticket.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
