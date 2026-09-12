import * as React from "react";
import { Building2 } from "lucide-react";
import type { EnrichedOrganization } from "./types";

interface OrganizationStatsHeaderProps {
  organizations: EnrichedOrganization[];
}

export function OrganizationStatsHeader({ organizations }: OrganizationStatsHeaderProps) {
  const activeCount = organizations.filter((o) => o.status === "ACTIVE").length;
  const provisioningCount = organizations.filter((o) => o.status === "PROVISIONING").length;
  const suspendedCount = organizations.filter(
    (o) => o.status === "SUSPENDED" || o.status === "OVERDUE"
  ).length;

  return (
    <>
      <div className="px-4 md:px-6 shrink-0">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
          <Building2 className="h-5 w-5 text-primary" />
          <span>Organizations Command Center</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Global oversight of all tenant ISP environments, hardware quotas, custom domains, and B2B subscriptions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{activeCount}</span>
          <span>Active Organizations</span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{provisioningCount}</span>
          <span>Provisioning</span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-destructive font-mono">{suspendedCount}</span>
          <span>Suspended</span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{organizations.length}</span>
          <span>Total</span>
        </div>
      </div>
    </>
  );
}
