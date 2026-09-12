import { Badge } from "@k2net/ui";
import { Activity, Radio, ShieldCheck } from "lucide-react";
import type { EnrichedOrganization } from "../../types";

interface OverviewTelemetryBannerProps {
  org: EnrichedOrganization;
}

export function OverviewTelemetryBanner({ org }: OverviewTelemetryBannerProps) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Activity className="h-4 w-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-foreground">Live Telemetry &amp; Tenant Health</h3>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.2">
              OPERATIONAL
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Poller engine active • Latency {org.apiLatencyMs}ms • Keycloak Realm Isolation Active
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono">
        <div className="px-2.5 py-1 rounded-md bg-background border border-border flex items-center gap-1.5 text-[11px]">
          <Radio className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Poller:</span>
          <span className="font-semibold text-foreground">4s ago</span>
        </div>
        <div className="px-2.5 py-1 rounded-md bg-background border border-border flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">SLA:</span>
          <span className="font-semibold text-foreground">{org.slaTier}</span>
        </div>
      </div>
    </div>
  );
}
