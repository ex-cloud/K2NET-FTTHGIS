import {
  Badge,
  Button,
  Card,
} from "@k2net/ui";
import {
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiAnalytics } from "./types";
import { ApiAnalyticsKpis } from "./ApiAnalyticsKpis";
import { ApiAnalyticsTimeseries } from "./ApiAnalyticsTimeseries";
import { TelemetryDateRangePicker } from "./TelemetryDateRangePicker";

import { ApiAnalyticsSkeleton } from "./ApiAnalyticsSkeleton";

interface ApiAnalyticsCardProps {
  analytics: ApiAnalytics | null;
  loadingAnalytics: boolean;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onRefreshAnalytics: () => void;
}

export function ApiAnalyticsCard({
  analytics,
  loadingAnalytics,
  timeRange = "24h",
  onTimeRangeChange,
  onRefreshAnalytics,
}: ApiAnalyticsCardProps) {
  const getBadgeLabel = (range: string) => {
    if (range === "24h") return "LIVE METRICS (24H)";
    if (range === "1h") return "LIVE METRICS (1H)";
    if (range === "7d") return "RENTANG: 7 HARI";
    if (range === "14d") return "RENTANG: 14 HARI";
    if (range === "30d") return "RENTANG: 30 HARI";
    if (range.startsWith("custom:")) return "RENTANG KUSTOM";
    return `RENTANG: ${range.toUpperCase()}`;
  };

  return (
    <Card className="p-5 space-y-5 bg-card border-border shadow-xs relative overflow-hidden">
      {/* Subtle syncing indicator bar when refreshing existing data */}
      {loadingAnalytics && analytics && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">API Usage & Gateway Latency Telemetry</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                {getBadgeLabel(timeRange)}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Monitoring volume pemanggilan REST API tenant melalui Kong Gateway dan SLA respon server.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onTimeRangeChange && (
            <TelemetryDateRangePicker
              value={timeRange}
              onChange={onTimeRangeChange}
            />
          )}

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

      {loadingAnalytics && !analytics ? (
        <ApiAnalyticsSkeleton />
      ) : !analytics ? (
        <div className="p-8 rounded-xl border border-dashed border-border bg-background/50 text-center space-y-2">
          <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto" />
          <div className="text-xs font-medium text-foreground">Belum ada data analitik tersedia</div>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Metrik akan otomatis muncul setelah ada aktivitas pemanggilan REST API melalui Kong Gateway.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "space-y-5 transition-opacity duration-300",
            loadingAnalytics && "opacity-60 pointer-events-none"
          )}
        >
          <ApiAnalyticsKpis analytics={analytics} />
          <ApiAnalyticsTimeseries analytics={analytics} />
        </div>
      )}
    </Card>
  );
}
