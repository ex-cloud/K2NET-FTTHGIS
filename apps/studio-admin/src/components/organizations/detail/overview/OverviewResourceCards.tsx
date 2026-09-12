import { Card } from "@k2net/ui";
import { Network, Server, Database, Cpu } from "lucide-react";
import type { EnrichedOrganization } from "../../types";

interface OverviewResourceCardsProps {
  org: EnrichedOrganization;
  usedOlts: number;
  effectiveMaxOlts: number;
  oltPct: number;
  usedOdps: number;
  effectiveMaxOdps: number;
  odpPct: number;
  storagePct: number;
  rpmPct: number;
}

export function OverviewResourceCards({
  org,
  usedOlts,
  effectiveMaxOlts,
  oltPct,
  usedOdps,
  effectiveMaxOdps,
  odpPct,
  storagePct,
  rpmPct,
}: OverviewResourceCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: OLT Capacity */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
            OLT Nodes
          </span>
          <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Network className="h-3 w-3" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xl font-bold tracking-tight text-foreground font-mono">
              {usedOlts} <span className="text-xs font-normal text-muted-foreground">/ {effectiveMaxOlts}</span>
            </p>
            <span className="text-xs font-mono font-semibold text-primary">{oltPct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, oltPct))}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>{Math.max(0, effectiveMaxOlts - usedOlts)} slot tersedia</span>
          <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {effectiveMaxOlts}</span>
        </div>
      </Card>

      {/* Card 2: ODP Enclosures */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
            Mapped ODPs
          </span>
          <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Server className="h-3 w-3" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xl font-bold tracking-tight text-foreground font-mono">
              {usedOdps} <span className="text-xs font-normal text-muted-foreground">/ {effectiveMaxOdps}</span>
            </p>
            <span className="text-xs font-mono font-semibold text-blue-500">{odpPct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, odpPct))}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Distribution splitters</span>
          <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {effectiveMaxOdps}</span>
        </div>
      </Card>

      {/* Card 3: Storage MinIO */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
            GIS S3 Storage
          </span>
          <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            <Database className="h-3 w-3" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xl font-bold tracking-tight text-foreground font-mono">
              {org.usedStorageGb} <span className="text-xs font-normal text-muted-foreground">/ {org.maxStorageGb} GB</span>
            </p>
            <span className="text-xs font-mono font-semibold text-purple-500">{storagePct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, storagePct))}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>MinIO Bucket</span>
          <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {org.maxStorageGb} GB</span>
        </div>
      </Card>

      {/* Card 4: API Rate Limit */}
      <Card glowingEffect className="p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
            Kong Gateway RPM
          </span>
          <div className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Cpu className="h-3 w-3" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xl font-bold tracking-tight text-foreground font-mono">
              {org.apiRateLimitUsed} <span className="text-xs font-normal text-muted-foreground">/ {org.apiRateLimitMax}</span>
            </p>
            <span className="text-xs font-mono font-semibold text-amber-500">{rpmPct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, rpmPct))}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Req/Min safety</span>
          <span className="text-[10px] text-muted-foreground/80 font-normal">Cap: {org.apiRateLimitMax}</span>
        </div>
      </Card>
    </div>
  );
}
