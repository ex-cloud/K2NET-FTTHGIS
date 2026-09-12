import { Network, Server, Database, Cpu } from "lucide-react";
import { Card } from "@k2net/ui";

interface QuotasKpiCardsProps {
  totalUsedOlts: number;
  totalMaxOlts: number;
  totalUsedOdps: number;
  totalMaxOdps: number;
  totalStorageGb: number;
  totalMaxStorageGb: number;
}

export function QuotasKpiCards({
  totalUsedOlts,
  totalMaxOlts,
  totalUsedOdps,
  totalMaxOdps,
  totalStorageGb,
  totalMaxStorageGb,
}: QuotasKpiCardsProps) {
  return (
    <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OLT Slots Quota */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              OLT Slots Quota
            </span>
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Network className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {totalUsedOlts} <span className="text-xs font-normal text-muted-foreground">/ {totalMaxOlts}</span>
              </p>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round((totalUsedOlts / totalMaxOlts) * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total registered OLT hardware</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(totalUsedOlts / totalMaxOlts) * 100}%` }}
            />
          </div>
        </Card>

        {/* ODP Enclosure Quota */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              ODP Enclosure Quota
            </span>
            <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Server className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {totalUsedOdps.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/ {totalMaxOdps.toLocaleString()}</span>
              </p>
              <span className="text-xs font-mono text-blue-500">
                {Math.round((totalUsedOdps / totalMaxOdps) * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total mapped splitters</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(totalUsedOdps / totalMaxOdps) * 100}%` }}
            />
          </div>
        </Card>

        {/* MinIO Storage Pool */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              MinIO Storage Pool
            </span>
            <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Database className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {totalStorageGb} <span className="text-xs font-normal text-muted-foreground">/ {totalMaxStorageGb} GB</span>
              </p>
              <span className="text-xs font-mono text-purple-500">
                {Math.round((totalStorageGb / totalMaxStorageGb) * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tenant S3 bucket utilization</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(totalStorageGb / totalMaxStorageGb) * 100}%` }}
            />
          </div>
        </Card>

        {/* Kong Rate Limits */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Kong Rate Limits
            </span>
            <div className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Cpu className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                20,000
              </p>
              <span className="text-xs font-mono text-muted-foreground">Max RPM</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Enterprise peak gateway burst</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "35%" }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
