import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Search, X } from "lucide-react";

export interface HistogramBucket {
  time: string;           // '12:43' — XAxis label
  fullDateLabel?: string; // 'Oct 03, 2026 12:43'
  rangeLabel?: string;    // 'Oct 3, 12:43 → Oct 3, 12:44'
  startTime: number;      // timestamp ms
  endTime: number;        // timestamp ms
  success: number;        // count of success logs in this bucket
  warning: number;        // count of warning logs
  error: number;          // count of error logs
}

export interface HourlySummaryItem {
  logGroup: string;
  logType: string;
  severity: string;
  eventHour: string;
  totalCount: number;
  errorCount: number;
  lastEventAt?: string;
}

export interface LogsHistogramCoreProps {
  data: HistogramBucket[];
  className?: string;
  onSelectRange?: (startIso: string, endIso: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; name: string; payload: HistogramBucket }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const bucketData = payload[0]?.payload as HistogramBucket | undefined;
  const success = payload.find((p) => p.dataKey === "success")?.value ?? 0;
  const warning = payload.find((p) => p.dataKey === "warning")?.value ?? 0;
  const error = payload.find((p) => p.dataKey === "error")?.value ?? 0;

  const headerLabel = bucketData?.fullDateLabel || label;

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-xl p-2.5 text-xs font-mono select-none min-w-[170px] space-y-2 z-50 pointer-events-none">
      <div className="text-[11px] font-medium text-foreground border-b border-border/40 pb-1.5">
        {headerLabel}
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-destructive shrink-0" />
            <span className="text-foreground font-medium">Error</span>
            <span className="text-muted-foreground/60 text-[9px]">5xx</span>
          </div>
          <span className="font-medium text-foreground font-mono">{error}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-amber-500 shrink-0" />
            <span className="text-foreground font-medium">Warning</span>
            <span className="text-muted-foreground/60 text-[9px]">4xx</span>
          </div>
          <span className="font-medium text-foreground font-mono">{warning}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-muted-foreground/50 shrink-0" />
            <span className="text-foreground font-medium">Success</span>
            <span className="text-muted-foreground/60 text-[9px]">2xx</span>
          </div>
          <span className="font-medium text-foreground font-mono">{success}</span>
        </div>
      </div>
    </div>
  );
}

export function LogsHistogramCore({ data = [], className, onSelectRange }: LogsHistogramCoreProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [selectedBucket, setSelectedBucket] = React.useState<{
    bucket: HistogramBucket;
    x: number;
    y: number;
  } | null>(null);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSelectedBucket(null);
      }
    }
    if (selectedBucket) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [selectedBucket]);

  if (!data || data.length === 0) {
    return null;
  }

  const openPopoverForBucket = (bucket: HistogramBucket, clientX?: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const coordX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
      const popoverWidth = 240;
      const left = Math.max(8, Math.min(coordX - popoverWidth / 2, rect.width - popoverWidth - 8));
      setSelectedBucket({
        bucket,
        x: left,
        y: 56,
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (state: any, e?: any) => {
    if (state?.activePayload && state.activePayload.length > 0) {
      const bucket = state.activePayload[0].payload as HistogramBucket;
      const clientX = e?.clientX ?? (state.activeCoordinate?.x ? (containerRef.current?.getBoundingClientRect().left ?? 0) + state.activeCoordinate.x : undefined);
      openPopoverForBucket(bucket, clientX);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDirectBarClick = (dataItem: any, _index: number, e: React.MouseEvent) => {
    e?.stopPropagation?.();
    const bucket = (dataItem?.payload || dataItem) as HistogramBucket;
    if (bucket && (bucket.startTime !== undefined || bucket.time)) {
      openPopoverForBucket(bucket, e?.clientX);
    }
  };

  return (
    <div ref={containerRef} className={`relative px-4 pt-2 pb-0 min-h-[52px] select-none ${className ?? ""}`}>
      <ResponsiveContainer width="100%" height={52}>
        <BarChart
          data={data}
          barSize={6}
          barGap={1}
          barCategoryGap={3}
          margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
          onClick={handleBarClick}
        >
          <XAxis
            dataKey="time"
            tick={({ x, y, payload }) => (
              <text
                x={x}
                y={y}
                dy={10}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] font-mono select-none"
              >
                {payload?.value}
              </text>
            )}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "hsl(var(--muted) / 0.4)", className: "cursor-pointer" }}
            wrapperStyle={{ zIndex: 40, pointerEvents: "none" }}
          />
          <Bar
            dataKey="success"
            stackId="a"
            fill="hsl(var(--muted-foreground) / 0.35)"
            name="Success"
            radius={[0, 0, 0, 0]}
            className="cursor-pointer"
            onClick={handleDirectBarClick}
          />
          <Bar
            dataKey="warning"
            stackId="a"
            fill="hsl(38 92% 50% / 0.7)"
            name="Warning"
            className="cursor-pointer"
            onClick={handleDirectBarClick}
          />
          <Bar
            dataKey="error"
            stackId="a"
            fill="hsl(var(--destructive) / 0.85)"
            name="Error"
            radius={[2, 2, 0, 0]}
            className="cursor-pointer"
            onClick={handleDirectBarClick}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Interactive Click Popover Modal */}
      {selectedBucket && (
        <div
          ref={popoverRef}
          style={{ left: `${selectedBucket.x}px`, top: `${selectedBucket.y}px` }}
          className="absolute z-50 rounded-xl border border-border bg-card text-card-foreground shadow-xl p-2.5 min-w-[240px] text-xs font-mono animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-1.5 mb-2 border-b border-border/50">
            <span className="font-medium text-foreground truncate pr-2">
              {selectedBucket.bucket.fullDateLabel || selectedBucket.bucket.rangeLabel || selectedBucket.bucket.time}
            </span>
            <button
              type="button"
              onClick={() => setSelectedBucket(null)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Quick counts summary */}
          <div className="flex items-center justify-between text-[10px] pb-2 mb-2 border-b border-border/40 px-0.5">
            <span className="flex items-center gap-1 text-destructive font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
              {selectedBucket.bucket.error} Err
            </span>
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {selectedBucket.bucket.warning} Warn
            </span>
            <span className="flex items-center gap-1 text-primary font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {selectedBucket.bucket.success} OK
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onSelectRange) {
                const startIso = new Date(selectedBucket.bucket.startTime).toISOString();
                const endIso = new Date(selectedBucket.bucket.endTime).toISOString();
                onSelectRange(startIso, endIso);
              }
              setSelectedBucket(null);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium bg-muted/20 text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer shadow-xs"
          >
            <Search className="w-3 h-3 shrink-0" />
            <span>Filter logs to selected range</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Build histogram data from CQRS Materialized Summary ─────────────

export function mapAnalyticsSummaryToBuckets(
  summaryList: HourlySummaryItem[],
  hours: number = 24
): HistogramBucket[] {
  const now = Date.now();
  const bucketCount = Math.min(hours, 24);
  const hourMs = 60 * 60 * 1000;

  const bucketMap = new Map<string, HistogramBucket>();
  const orderedKeys: string[] = [];

  for (let i = bucketCount - 1; i >= 0; i--) {
    const slotStart = now - (i + 1) * hourMs;
    const slotEnd = now - i * hourMs;
    const slotTime = new Date(slotStart);
    const label = `${slotTime.getHours().toString().padStart(2, "0")}:00`;
    const dateKey = `${slotTime.toISOString().substring(0, 13)}:00`;
    orderedKeys.push(dateKey);
    bucketMap.set(dateKey, {
      time: label,
      fullDateLabel: format(slotTime, "MMM dd, yyyy HH:00"),
      rangeLabel: `${format(slotTime, "MMM d, HH:00")} → ${format(new Date(slotEnd), "MMM d, HH:00")}`,
      startTime: slotStart,
      endTime: slotEnd,
      success: 0,
      warning: 0,
      error: 0,
    });
  }

  if (Array.isArray(summaryList)) {
    for (const item of summaryList) {
      if (!item.eventHour) continue;
      const hourKey = `${new Date(item.eventHour).toISOString().substring(0, 13)}:00`;
      const bucket = bucketMap.get(hourKey);
      if (bucket) {
        const errors = Number(item.errorCount) || 0;
        const total = Number(item.totalCount) || 0;
        const success = Math.max(0, total - errors);

        const sev = (item.severity || "").toUpperCase();
        if (sev === "WARN" || sev === "WARNING") {
          bucket.warning += total;
        } else if (sev === "ERROR" || sev === "CRITICAL" || errors > 0) {
          bucket.error += errors > 0 ? errors : total;
          bucket.success += Math.max(0, total - errors);
        } else {
          bucket.success += success;
        }
      }
    }
  }

  return orderedKeys.map((key) => bucketMap.get(key)!);
}

// ─── Helper: Build histogram data from Generic Log Array ─────────────────────

function formatBucketLabel(d: Date, totalSpanMs: number): string {
  const isMultiDay = totalSpanMs > 24 * 60 * 60 * 1000;
  const isMultiWeek = totalSpanMs > 7 * 24 * 60 * 60 * 1000;

  if (isMultiWeek) {
    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("default", { month: "short" });
    return `${day} ${month}`;
  }
  if (isMultiDay) {
    const day = d.getDate().toString().padStart(2, "0");
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${day}d ${hh}:${mm}`;
  }
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function buildHistogramDataFromLogs<T extends { timestamp?: string; severity?: string; status?: number | string }>(
  logs: T[] = [],
  timeRange?: string
): HistogramBucket[] {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const BUCKET_COUNT = 24;
  const now = Date.now();

  let totalSpanMs = 60 * 60 * 1000; // default 1 hour
  let rangeStart = now - totalSpanMs;
  let rangeEnd = now;

  if (timeRange) {
    if (timeRange.startsWith("custom:")) {
      const parts = timeRange.substring(7).split("_");
      if (parts.length === 2) {
        const s = new Date(parts[0]).getTime();
        const e = new Date(parts[1]).getTime();
        if (!isNaN(s) && !isNaN(e) && e > s) {
          rangeStart = s;
          rangeEnd = e;
          totalSpanMs = e - s;
        }
      }
    } else {
      const match = timeRange.match(/^(\d+)([mhd])$/);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = match[2];
        if (unit === "m") totalSpanMs = val * 60 * 1000;
        else if (unit === "h") totalSpanMs = val * 60 * 60 * 1000;
        else if (unit === "d") totalSpanMs = val * 24 * 60 * 60 * 1000;
        rangeStart = now - totalSpanMs;
        rangeEnd = now;
      }
    }
  }

  const validTimestamps = safeLogs
    .map((l) => (l?.timestamp ? new Date(l.timestamp).getTime() : NaN))
    .filter((t) => !isNaN(t));

  if (validTimestamps.length > 0) {
    const minLogTime = validTimestamps.reduce((min, t) => Math.min(min, t), Infinity);
    const maxLogTime = validTimestamps.reduce((max, t) => Math.max(max, t), -Infinity);

    const logsInWindow = validTimestamps.filter((t) => t >= rangeStart && t <= rangeEnd).length;
    if (logsInWindow === 0 && isFinite(minLogTime) && isFinite(maxLogTime)) {
      const logSpan = Math.max(maxLogTime - minLogTime, 5 * 60 * 1000);
      const padding = Math.max(logSpan * 0.05, 60 * 1000);
      rangeStart = minLogTime - padding;
      rangeEnd = maxLogTime + padding;
      totalSpanMs = rangeEnd - rangeStart;
    }
  }

  const bucketMs = Math.max(totalSpanMs / BUCKET_COUNT, 1000);

  const buckets: HistogramBucket[] = Array.from({ length: BUCKET_COUNT }, (_, i) => {
    const bucketStart = rangeStart + i * bucketMs;
    const bucketEnd = bucketStart + bucketMs;
    const bucketStartTime = new Date(bucketStart);
    const bucketEndTime = new Date(bucketEnd);

    return {
      time: formatBucketLabel(bucketStartTime, totalSpanMs),
      fullDateLabel: format(bucketStartTime, "MMM dd, yyyy HH:mm"),
      rangeLabel: `${format(bucketStartTime, "MMM d, HH:mm")} → ${format(bucketEndTime, "MMM d, HH:mm")}`,
      startTime: bucketStart,
      endTime: bucketEnd,
      success: 0,
      warning: 0,
      error: 0,
    };
  });

  safeLogs.forEach((log) => {
    if (!log?.timestamp) return;
    const logTime = new Date(log.timestamp).getTime();
    if (isNaN(logTime) || logTime < rangeStart || logTime > rangeEnd) return;

    let bucketIdx = Math.floor((logTime - rangeStart) / bucketMs);
    if (bucketIdx < 0) bucketIdx = 0;
    if (bucketIdx >= BUCKET_COUNT) bucketIdx = BUCKET_COUNT - 1;

    const severity = log.severity?.toUpperCase();
    const isErrorStatus = typeof log.status === "number" ? log.status >= 500 : String(log.status) === "FAILED";
    if (severity === "ERROR" || severity === "CRITICAL" || isErrorStatus) {
      buckets[bucketIdx].error++;
    } else if (severity === "WARN" || severity === "WARNING") {
      buckets[bucketIdx].warning++;
    } else {
      buckets[bucketIdx].success++;
    }
  });

  return buckets;
}
