import { AlertTriangle } from "lucide-react";
import type { ApiAnalytics } from "./types";

interface ApiAnalyticsTimeseriesProps {
  analytics: ApiAnalytics;
}

export function ApiAnalyticsTimeseries({ analytics }: ApiAnalyticsTimeseriesProps) {
  const total =
    (analytics.statusBreakdown.status2xx || 0) +
    (analytics.statusBreakdown.status4xx || 0) +
    (analytics.statusBreakdown.status5xx || 0);

  const pct2xx = total > 0 ? ((analytics.statusBreakdown.status2xx || 0) / total) * 100 : 98;
  const pct4xx = total > 0 ? ((analytics.statusBreakdown.status4xx || 0) / total) * 100 : 1.5;
  const pct5xx = total > 0 ? ((analytics.statusBreakdown.status5xx || 0) / total) * 100 : 0.5;

  const maxDaily = analytics.dailyTimeseries
    ? Math.max(...analytics.dailyTimeseries.map((d) => d.requests), 100)
    : 100;

  return (
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
  );
}
