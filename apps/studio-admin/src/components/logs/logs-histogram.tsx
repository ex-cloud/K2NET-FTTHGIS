import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Search, X } from "lucide-react";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { getAuthHeaders } from "@/lib/actions/gateways/common";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface LogsHistogramProps {
  data: HistogramBucket[];
  className?: string;
  onSelectRange?: (startIso: string, endIso: string) => void;
}

// Custom tooltip props — compatible with recharts v3
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; name: string; payload: HistogramBucket }>;
  label?: string;
}

// ─── Custom Tooltip (100% Solid & High-Contrast, matching Supabase) ───────────

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const bucketData = payload[0]?.payload as HistogramBucket | undefined;
  const success = payload.find((p) => p.dataKey === "success")?.value ?? 0;
  const warning = payload.find((p) => p.dataKey === "warning")?.value ?? 0;
  const error   = payload.find((p) => p.dataKey === "error")?.value   ?? 0;

  const headerLabel = bucketData?.fullDateLabel || label;

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-2xl p-2.5 text-xs font-mono select-none min-w-[170px] space-y-2 z-50 pointer-events-none">
      <div className="text-[11px] font-semibold text-foreground border-b border-border/40 pb-1.5">
        {headerLabel}
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-rose-500 shrink-0" />
            <span className="text-foreground">Error</span>
            <span className="text-muted-foreground/60 text-[9px]">5xx</span>
          </div>
          <span className="font-bold text-foreground font-mono">{error}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-amber-500 shrink-0" />
            <span className="text-foreground">Warning</span>
            <span className="text-muted-foreground/60 text-[9px]">4xx</span>
          </div>
          <span className="font-bold text-foreground font-mono">{warning}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-primary shrink-0" />
            <span className="text-foreground">Success</span>
            <span className="text-muted-foreground/60 text-[9px]">2xx</span>
          </div>
          <span className="font-bold text-foreground font-mono">{success}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component with Interactive Bar Drill-Down ───────────────────────────

export function LogsHistogram({ data = [], className, onSelectRange }: LogsHistogramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedBucket, setSelectedBucket] = useState<{
    bucket: HistogramBucket;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (state: any) => {
    if (state?.activePayload && state.activePayload.length > 0) {
      const bucket = state.activePayload[0].payload as HistogramBucket;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const coordX = state.activeCoordinate?.x ?? 50;
        const popoverWidth = 230;
        const left = Math.max(8, Math.min(coordX - popoverWidth / 2, rect.width - popoverWidth - 8));
        setSelectedBucket({
          bucket,
          x: left,
          y: 4,
        });
      }
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
            wrapperStyle={{ zIndex: 40 }}
          />
          <Bar
            dataKey="success"
            stackId="a"
            fill="hsl(142 71% 45%)"
            name="Success"
            radius={[0, 0, 0, 0]}
            className="cursor-pointer"
          />
          <Bar
            dataKey="warning"
            stackId="a"
            fill="hsl(38 92% 50%)"
            name="Warning"
            className="cursor-pointer"
          />
          <Bar
            dataKey="error"
            stackId="a"
            fill="hsl(0 84% 60%)"
            name="Error"
            radius={[2, 2, 0, 0]}
            className="cursor-pointer"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Interactive Click Popover Modal (matching Supabase drill-down UX) */}
      {selectedBucket && (
        <div
          ref={popoverRef}
          style={{ left: `${selectedBucket.x}px`, top: `${selectedBucket.y}px` }}
          className="absolute z-50 rounded-lg border border-border bg-card text-card-foreground shadow-2xl p-2 min-w-[220px] text-xs font-mono animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-1.5 mb-1.5 border-b border-border/50">
            <span className="font-semibold text-foreground truncate pr-2">
              {selectedBucket.bucket.rangeLabel || selectedBucket.bucket.time}
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
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted/80 hover:text-primary transition-colors cursor-pointer font-sans"
          >
            <Search className="w-3.5 h-3.5 text-primary shrink-0" />
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

  // Initialize hourly slots
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

  // Aggregate items into hourly slots
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

// ─── Hook: Fast Analytics Summary CQRS Stream (< 10ms) ───────────────────────

export function useAuditAnalyticsSummary(
  timeRange: string = "24h",
  tenantSlug?: string
): {
  summaryBuckets: HistogramBucket[] | null;
  loading: boolean;
} {
  const [summaryBuckets, setSummaryBuckets] = useState<HistogramBucket[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchSummary() {
      let hours = 24;
      if (timeRange.endsWith("h")) {
        hours = parseInt(timeRange.replace("h", ""), 10) || 24;
      } else if (timeRange.endsWith("d")) {
        hours = (parseInt(timeRange.replace("d", ""), 10) || 1) * 24;
      } else if (timeRange.endsWith("m")) {
        hours = 1;
      }

      try {
        setLoading(true);
        const q = new URLSearchParams();
        q.set("hours", String(hours));
        if (tenantSlug && tenantSlug.trim() && tenantSlug !== "all") {
          q.set("tenantSlug", tenantSlug.trim());
        }

        const res = await fetch(`/api/v1/audit/analytics/summary?${q.toString()}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Summary API unavailable");
        const json = await res.json();
        if (active && json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setSummaryBuckets(mapAnalyticsSummaryToBuckets(json.data, hours));
        } else if (active) {
          setSummaryBuckets(null);
        }
      } catch {
        if (active) setSummaryBuckets(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchSummary();
    const timer = setInterval(fetchSummary, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [timeRange, tenantSlug]);

  return { summaryBuckets, loading };
}

// ─── Helper: Build histogram data from AuditStreamEntry[] ─────────────────────

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

export function buildHistogramData(
  logs: AuditStreamEntry[] = [],
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

  // Safe min/max using reduce without stack-overflow risk
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

  // Generate bucket slots with fullDateLabel, rangeLabel, startTime, and endTime
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

  // Bin logs into buckets safely
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
