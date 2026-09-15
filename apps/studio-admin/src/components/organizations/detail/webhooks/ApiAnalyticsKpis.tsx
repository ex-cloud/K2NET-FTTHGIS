import { TrendingUp, CheckCircle2, Clock, Zap } from "lucide-react";
import type { ApiAnalytics } from "./types";

interface ApiAnalyticsKpisProps {
  analytics: ApiAnalytics;
}

export function ApiAnalyticsKpis({ analytics }: ApiAnalyticsKpisProps) {
  const total24h = analytics?.totalRequests24h ?? 0;
  const successRate = analytics?.successRatePercent ?? 100;
  const p95Latency = analytics?.p95LatencyMs ?? 0;
  const quotaUsed = analytics?.rateLimitQuotaUsedPercent ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
        <span className="text-[10px] text-foreground/75 dark:text-muted-foreground block font-medium">
          Total Requests (24h)
        </span>
        <div className="text-lg font-bold text-foreground font-mono">
          {total24h.toLocaleString()}
        </div>
        <div className="text-[10px] text-primary flex items-center gap-1 font-medium">
          <TrendingUp className="h-3 w-3" />
          <span>Kong Edge Gateway</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
        <span className="text-[10px] text-foreground/75 dark:text-muted-foreground block font-medium">
          Success Rate
        </span>
        <div className="text-lg font-bold text-foreground font-mono">
          {successRate.toFixed(1)}%
        </div>
        <div className="text-[10px] text-primary flex items-center gap-1 font-medium">
          <CheckCircle2 className="h-3 w-3" />
          <span>HTTP 2xx Success</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
        <span className="text-[10px] text-foreground/75 dark:text-muted-foreground block font-medium">
          p95 Latency SLA
        </span>
        <div className="text-lg font-bold text-foreground font-mono">
          {p95Latency} ms
        </div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>p95 Target &lt; 150ms</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
        <span className="text-[10px] text-foreground/75 dark:text-muted-foreground block font-medium">
          Rate Limit Quota
        </span>
        <div className="text-lg font-bold text-foreground font-mono">
          {quotaUsed.toFixed(1)}%
        </div>
        <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>Max 5,000 req/min</span>
        </div>
      </div>
    </div>
  );
}
