import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function IssuesPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["ticket.view", "ticket.create", "ticket.update", "ticket.assign"]}
      fallback={
        <TenantAccessDenied
          title="Akses Tiket Gangguan Dibatasi"
          description="Anda memerlukan hak akses troubleshooting untuk melihat tiket gangguan jaringan dan dispatcher lapangan."
          requiredPermission="ticket.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
