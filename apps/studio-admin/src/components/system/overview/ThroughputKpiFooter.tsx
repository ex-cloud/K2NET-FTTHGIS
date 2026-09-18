import { Button } from "@k2net/ui";
import { ArrowUpRight, Zap } from "lucide-react";

interface ThroughputKpiFooterProps {
  total24hRequests: number;
  maxHits: number;
  avgLatency24h: number;
  onNavigateObservability: () => void;
}

export function ThroughputKpiFooter({
  total24hRequests,
  maxHits,
  avgLatency24h,
  onNavigateObservability,
}: ThroughputKpiFooterProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
      <div className="space-y-0.5">
        <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
          Total 24h Volume
        </p>
        <p className="text-sm font-bold font-mono text-foreground">
          {total24hRequests.toLocaleString()}{" "}
          <span className="text-[10px] font-normal text-muted-foreground">reqs</span>
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
          Peak Throughput
        </p>
        <p className="text-sm font-bold font-mono text-primary">
          {maxHits}{" "}
          <span className="text-[10px] font-normal text-muted-foreground">req/min</span>
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
          Avg Gateway Latency
        </p>
        <p className="text-sm font-bold font-mono text-foreground flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          {avgLatency24h} ms
        </p>
      </div>

      {/* Full-width button on mobile (col-span-2), right-aligned on sm+ */}
      <div className="col-span-2 sm:col-span-1 flex items-center sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onNavigateObservability}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer w-full sm:w-auto"
        >
          <span>Full Observability</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
