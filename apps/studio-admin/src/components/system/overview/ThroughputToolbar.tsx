import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  TrendingUp,
  MapPin,
  Server,
  MessageSquare,
  Layers,
} from "lucide-react";
import type { ServiceFilterType, ChartViewMode } from "./overview-throughput-types";

interface ThroughputToolbarProps {
  serviceFilter: ServiceFilterType;
  setServiceFilter: (filter: ServiceFilterType) => void;
  chartMode: ChartViewMode;
  setChartMode: (mode: ChartViewMode) => void;
}

export function ThroughputToolbar({
  serviceFilter,
  setServiceFilter,
  chartMode,
  setChartMode,
}: ThroughputToolbarProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 lg:flex-row lg:items-center">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-primary" />
          <h4 className="text-sm font-bold tracking-tight text-foreground">
            Combined System Throughput & Gateway Load
          </h4>
          <Badge variant="outline" className="border-border text-[9px] font-mono text-muted-foreground uppercase">
            24h Window
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Aggregated API request load, geocoding queries, and microservice traffic across all tenants.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Service Filter Buttons — horizontally scrollable on mobile */}
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 min-w-max">
            <button
              type="button"
              onClick={() => setServiceFilter("ALL")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                serviceFilter === "ALL"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="h-3 w-3" />
              <span>All Traffic</span>
            </button>
            <button
              type="button"
              onClick={() => setServiceFilter("MAP")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                serviceFilter === "MAP"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="h-3 w-3 text-primary" />
              <span>Map &amp; GIS</span>
            </button>
            <button
              type="button"
              onClick={() => setServiceFilter("API")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                serviceFilter === "API"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Server className="h-3 w-3 text-blue-500" />
              <span>Core API</span>
            </button>
            <button
              type="button"
              onClick={() => setServiceFilter("MESSAGING")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                serviceFilter === "MESSAGING"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-3 w-3 text-primary" />
              <span>Messaging</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher: Bars vs Area */}
        <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setChartMode("bars")}
            title="Bar Histogram"
            className={cn(
              "flex items-center gap-1 rounded-md p-1.5 text-xs transition-colors cursor-pointer",
              chartMode === "bars"
                ? "bg-card text-primary shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartMode("area")}
            title="Smooth Area Wave"
            className={cn(
              "flex items-center gap-1 rounded-md p-1.5 text-xs transition-colors cursor-pointer",
              chartMode === "area"
                ? "bg-card text-primary shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
