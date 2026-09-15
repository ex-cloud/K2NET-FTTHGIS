import {
  Badge,
  Button,
  Card,
} from "@k2net/ui";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiAnalytics } from "./types";

interface ApiAnalyticsCardProps {
  analytics: ApiAnalytics | null;
  loadingAnalytics: boolean;
  onRefreshAnalytics: () => void;
}

export function ApiAnalyticsCard({
  analytics,
  loadingAnalytics,
  onRefreshAnalytics,
}: ApiAnalyticsCardProps) {
  const total = (analytics?.statusBreakdown.status2xx || 0) +
    (analytics?.statusBreakdown.status4xx || 0) +
    (analytics?.statusBreakdown.status5xx || 0);

  const pct2xx = total > 0 ? ((analytics?.statusBreakdown.status2xx || 0) / total) * 100 : 98;
  const pct4xx = total > 0 ? ((analytics?.statusBreakdown.status4xx || 0) / total) * 100 : 1.5;
  const pct5xx = total > 0 ? ((analytics?.statusBreakdown.status5xx || 0) / total) * 100 : 0.5;

  const maxDaily = analytics?.dailyTimeseries
    ? Math.max(...analytics.dailyTimeseries.map((d) => d.requests), 100)
    : 100;

  return (
    <Card className="p-5 space-y-5 bg-card border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">API Usage & Gateway Latency Telemetry</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                LIVE METRICS (24H)
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Monitoring volume pemanggilan REST API tenant melalui Kong Gateway dan SLA respon server.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshAnalytics}
            disabled={loadingAnalytics}
            className="h-7 px-2.5 text-xs border-border text-foreground hover:bg-muted gap-1.5 cursor-pointer"
          >
            <RotateCcw className={cn("h-3 w-3", loadingAnalytics && "animate-spin")} />
            <span>Refresh Metrics</span>
          </Button>
        </div>
      </div>

      {loadingAnalytics ? (
        <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
          Memuat metrik observabilitas API...
        </div>
      ) : !analytics ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          Belum ada data analitik tersedia.
        </div>
      ) : (
        <div className="space-y-5">
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
              <span className="text-[10px] text-foreground/75 dark:text-muted-foreground block font-medium">
                Total Requests (24h)
              </span>
              <div className="text-lg font-bold text-foreground font-mono">
                {analytics.totalRequests24h.toLocaleString()}
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
                {analytics.successRatePercent.toFixed(1)}%
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
                {analytics.p95LatencyMs} ms
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
                {analytics.rateLimitQuotaUsedPercent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Max 5,000 req/min</span>
              </div>
            </div>
          </div>

          {/* 7-Day Timeseries Chart & Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 7-Day Bar Chart */}
            <div className="md:col-span-2 p-4 rounded-xl border border-border/80 bg-background/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Aktivitas Permintaan API 7 Hari Terakhir
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Volume Harian</span>
              </div>

              <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1">
                {analytics.dailyTimeseries.map((day) => {
                  const heightPct = Math.max(Math.round((day.requests / maxDaily) * 100), 10);
                  const dayLabel = new Date(day.date).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                  });
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                    >
                      <div className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.requests.toLocaleString()}
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[28px] rounded-t bg-primary/70 group-hover:bg-primary transition-all relative"
                      >
                        {day.errors > 0 && (
                          <div
                            style={{ height: `${Math.min((day.errors / day.requests) * 100, 100)}%` }}
                            className="w-full rounded-t bg-destructive absolute bottom-0 left-0"
                          />
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Breakdown Bar & Legend */}
            <div className="p-4 rounded-xl border border-border/80 bg-background/40 space-y-3">
              <span className="text-xs font-semibold text-foreground block">
                Distribusi Status HTTP
              </span>

              {/* Stacked Progress Bar */}
              <div className="h-4 w-full rounded-full overflow-hidden bg-muted flex border border-border/60">
                <div
                  style={{ width: `${pct2xx}%` }}
                  className="bg-primary h-full transition-all"
                  title={`2xx Success: ${pct2xx.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${pct4xx}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`4xx Client Error: ${pct4xx.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${pct5xx}%` }}
                  className="bg-destructive h-full transition-all"
                  title={`5xx Server Error: ${pct5xx.toFixed(1)}%`}
                />
              </div>

              {/* Legend List */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>2xx OK / Created</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {analytics.statusBreakdown.status2xx.toLocaleString()} ({pct2xx.toFixed(1)}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>4xx Client Errors (401/404)</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {analytics.statusBreakdown.status4xx.toLocaleString()} ({pct4xx.toFixed(1)}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span>5xx Server Errors</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {analytics.statusBreakdown.status5xx.toLocaleString()} ({pct5xx.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-muted-foreground border-t border-border/50 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                <span>Status 4xx mencakup API key invalid atau scope tidak diizinkan.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
