

import { Building2, UploadCloud, Network, AlertTriangle } from "lucide-react";
import { Card } from "@k2net/ui";
import type { EnrichedOrganization } from "./types";

interface OrganizationKpiStripProps {
  organizations: EnrichedOrganization[];
  compactView?: boolean;
}

export function OrganizationKpiStrip({
  organizations,
  compactView = false,
}: OrganizationKpiStripProps) {
  if (compactView) return null;

  const total = organizations.length;
  const activeCount = organizations.filter((o) => o.status === "ACTIVE").length;
  const provisioningCount = organizations.filter((o) => o.status === "PROVISIONING").length;
  const trialCount = organizations.filter((o) => o.status === "TRIAL").length;
  const atRiskCount = organizations.filter(
    (o) => o.status === "SUSPENDED" || o.status === "OVERDUE" || o.status === "TRIAL_EXPIRED"
  ).length;

  const totalOlts = organizations.reduce((acc, o) => acc + (o.usedOlts || 0), 0);
  const maxOlts = organizations.reduce((acc, o) => acc + (o.maxOlts || 5), 0);
  const totalOdps = organizations.reduce((acc, o) => acc + (o.usedOdps || 0), 0);

  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  const oltPct = maxOlts > 0 ? Math.min(100, Math.round((totalOlts / maxOlts) * 100)) : 0;
  const atRiskPct = total > 0 ? Math.round((atRiskCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. ACTIVE TENANTS */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            Active Tenants
          </span>
          <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Building2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {activeCount}
            </p>
            <span className="text-xs font-mono text-muted-foreground">
              {activePct}% Ratio
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCount} of {total} organizations live
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>Utilization</span>
            <span>{activePct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${activePct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 2. PROVISIONING QUEUE */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            Provisioning & Trial
          </span>
          <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <UploadCloud className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {provisioningCount + trialCount}
            </p>
            <span className="text-xs font-mono text-blue-500">
              {provisioningCount > 0 ? "In Setup" : "On Trial"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {provisioningCount} provisioning, {trialCount} in trial
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>Utilization</span>
            <span>{Math.min(100, (provisioningCount + trialCount) * 25)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (provisioningCount + trialCount) * 25)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 3. HARDWARE DEPLOYED */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            FTTH Hardware
          </span>
          <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Network className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {totalOlts} <span className="text-xs font-normal text-muted-foreground">OLTs</span>
            </p>
            <span className="text-xs font-mono text-primary">
              {totalOdps} ODPs
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {oltPct}% allocated network capacity
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>Utilization</span>
            <span>{oltPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${oltPct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 4. AT RISK / SUSPENDED */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            Overdue / Inactive
          </span>
          <div className="h-6 w-6 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {atRiskCount}
            </p>
            <span className="text-xs font-mono text-destructive">
              {atRiskPct > 0 ? `${atRiskPct}% Rate` : "Healthy"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {atRiskCount === 0 ? "All tenant accounts operational" : "Action required on overdue accounts"}
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>Utilization</span>
            <span>{Math.min(100, atRiskCount * 33)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, atRiskCount * 33)}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
