"use client";

import React from "react";
import { Building2, UploadCloud, Network, AlertTriangle } from "lucide-react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-2 shrink-0 animate-in fade-in duration-200">
      {/* 1. ACTIVE TENANTS */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
            Active Tenants
          </span>
          <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Building2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {activeCount}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {activePct}% Ratio
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {activeCount} of {total} organizations live
          </p>
          <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${activePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. PROVISIONING QUEUE */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
            Provisioning & Trial
          </span>
          <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <UploadCloud className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {provisioningCount + trialCount}
            </span>
            <span className="text-[11px] font-mono text-blue-500">
              {provisioningCount > 0 ? "In Setup" : "On Trial"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {provisioningCount} provisioning, {trialCount} in trial
          </p>
          <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (provisioningCount + trialCount) * 25)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. HARDWARE DEPLOYED */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
            FTTH Hardware
          </span>
          <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Network className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {totalOlts} <span className="text-xs font-normal text-muted-foreground">OLTs</span>
            </span>
            <span className="text-[11px] font-mono text-primary">
              {totalOdps} ODPs
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {oltPct}% allocated network capacity
          </p>
          <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${oltPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. AT RISK / SUSPENDED */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-widest font-mono">
            Overdue / Inactive
          </span>
          <div className="h-6 w-6 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {atRiskCount}
            </span>
            <span className="text-[11px] font-mono text-destructive">
              {atRiskPct > 0 ? `${atRiskPct}% Rate` : "Healthy"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {atRiskCount === 0 ? "All tenant accounts operational" : "Action required on overdue accounts"}
          </p>
          <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-destructive rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, atRiskCount * 33)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
