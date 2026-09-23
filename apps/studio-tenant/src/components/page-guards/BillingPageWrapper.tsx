import { type ReactNode } from "react";
import { PermissionGuard } from "../../hooks/use-permissions";
import { TenantAccessDenied } from "./TenantAccessDenied";

export function BillingPageWrapper({ children }: { children: ReactNode }) {
  return (
    <PermissionGuard
      permission={["billing.view", "billing.manage"]}
      fallback={
        <TenantAccessDenied
          title="Akses Tagihan & Langganan Dibatasi"
          description="Hanya pemilik organisasi atau tim keuangan yang dapat melihat riwayat faktur, upgrade tier paket, dan invoice Xendit."
          requiredPermission="billing.view"
        />
      }
    >
      {children}
    </PermissionGuard>
  );
}
