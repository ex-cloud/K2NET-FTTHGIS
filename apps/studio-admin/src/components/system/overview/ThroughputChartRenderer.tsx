import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  EnrichedThroughputPoint,
  ServiceFilterType,
  ChartViewMode,
} from "./overview-throughput-types";
import { RechartsCustomTooltip } from "./ThroughputTooltipContent";

interface ThroughputChartRendererProps {
  enrichedData: EnrichedThroughputPoint[];
  chartMode: ChartViewMode;
  serviceFilter: ServiceFilterType;
  onDrilldown: (point: EnrichedThroughputPoint) => void;
}

export function ThroughputChartRenderer({
  enrichedData,
  chartMode,
  serviceFilter,
  onDrilldown,
}: ThroughputChartRendererProps) {
  return (
    <div className="relative mt-4">
      <div className="h-32 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "bars" ? (
            <BarChart
              data={enrichedData}
              margin={{ top: 5, right: 4, left: 4, bottom: 0 }}
              barSize={14}
              onClick={(state: unknown) => {
                const s = state as { activePayload?: { payload?: EnrichedThroughputPoint }[] } | null;
                if (s?.activePayload?.[0]?.payload) {
                  onDrilldown(s.activePayload[0].payload);
                }
              }}
            >
              <defs>
                <linearGradient id="throughputBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis hide domain={[0, "dataMax + 20"]} />
              <Tooltip
                content={<RechartsCustomTooltip serviceFilter={serviceFilter} />}
                cursor={false}
                isAnimationActive={false}
              />
              <Bar
                dataKey="filteredHits"
                name="Requests"
                fill="url(#throughputBarGradient)"
                radius={[3, 3, 0, 0]}
                className="cursor-pointer"
                activeBar={{
                  fill: "var(--primary)",
                  stroke: "var(--primary)",
                  strokeWidth: 1,
                  opacity: 1,
                }}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={enrichedData}
              margin={{ top: 5, right: 4, left: 4, bottom: 0 }}
              onClick={(state: unknown) => {
                const s = state as { activePayload?: { payload?: EnrichedThroughputPoint }[] } | null;
                if (s?.activePayload?.[0]?.payload) {
                  onDrilldown(s.activePayload[0].payload);
                }
              }}
            >
              <defs>
                <linearGradient id="throughputAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis hide domain={[0, "dataMax + 20"]} />
              <Tooltip
                content={<RechartsCustomTooltip serviceFilter={serviceFilter} />}
                cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "3 3" }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="filteredHits"
                name="Requests"
                stroke="var(--primary)"
                fill="url(#throughputAreaGradient)"
                strokeWidth={2}
                className="cursor-pointer"
                activeDot={{
                  r: 5,
                  stroke: "var(--card)",
                  strokeWidth: 2,
                  fill: "var(--primary)",
                }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Timeline Axis Labels */}
      <div className="mt-2 flex justify-between px-1 text-[9px] font-mono text-muted-foreground">
        <span>24 Jam Lalu</span>
        <span>12 Jam Lalu</span>
        <span className="flex items-center gap-1 font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Sekarang (Live)
        </span>
      </div>
    </div>
  );
}
