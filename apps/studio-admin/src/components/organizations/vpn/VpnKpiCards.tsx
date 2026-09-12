import { ShieldCheck, Activity, Radio, Network } from "lucide-react";
import { Card } from "@k2net/ui";
import type { VpnTunnelInfo } from "./types";

interface VpnKpiCardsProps {
  tunnels: VpnTunnelInfo[];
}

export function VpnKpiCards({ tunnels }: VpnKpiCardsProps) {
  return (
    <div className="px-4 md:px-6 shrink-0 animate-in fade-in-50 duration-150">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Mesh Tunnels */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Active Mesh Tunnels
            </span>
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                {tunnels.length} / {tunnels.length}
              </p>
              <span className="text-xs font-mono text-primary font-semibold">100% Up</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active site-to-site overlays</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>

        {/* Mean Mesh Latency */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Mean Mesh Latency
            </span>
            <div className="h-6 w-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                12.4 ms
              </p>
              <span className="text-xs font-mono text-blue-500 font-semibold">Fast</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Round trip SNMP response time</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: "85%" }} />
          </div>
        </Card>

        {/* Total Throughput */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              Total Throughput
            </span>
            <div className="h-6 w-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Radio className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                28.6 Mbps
              </p>
              <span className="text-xs font-mono text-purple-500">Telemetries</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Aggregated poller payload</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: "42%" }} />
          </div>
        </Card>

        {/* BRAS Cluster Nodes */}
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
              BRAS Cluster Nodes
            </span>
            <div className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Network className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold tracking-tight text-foreground font-mono">
                3 Nodes
              </p>
              <span className="text-xs font-mono text-muted-foreground">High Availability</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">WireGuard load balanced</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
