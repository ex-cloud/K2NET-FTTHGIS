

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistogramBucket {
  time: string;    // '13:45' — XAxis label
  success: number; // count of success logs in this bucket
  warning: number; // count of warning logs
  error: number;   // count of error logs
}

interface LogsHistogramProps {
  data: HistogramBucket[];
  className?: string;
}

// Custom tooltip props — compatible with recharts v3 (avoids TooltipProps<> generic issues)
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; name: string }>;
  label?: string;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const success = payload.find((p) => p.dataKey === "success")?.value ?? 0;
  const warning = payload.find((p) => p.dataKey === "warning")?.value ?? 0;
  const error   = payload.find((p) => p.dataKey === "error")?.value   ?? 0;
  const total   = success + warning + error;

  return (
    <div className="rounded-md border border-border bg-card/95 backdrop-blur p-2 text-[10px] font-mono shadow-lg space-y-1">
      <p className="text-muted-foreground font-semibold">{label}</p>
      <div className="space-y-0.5">
        {success > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/80 shrink-0" />
            <span className="text-primary/80">Success</span>
            <span className="text-foreground font-bold ml-auto">{success}</span>
          </div>
        )}
        {warning > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-amber-400">Warning</span>
            <span className="text-foreground font-bold ml-auto">{warning}</span>
          </div>
        )}
        {error > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-rose-400">Error</span>
            <span className="text-foreground font-bold ml-auto">{error}</span>
          </div>
        )}
        <div className="border-t border-border/50 pt-0.5 flex justify-between text-muted-foreground">
          <span>Total</span>
          <span className="font-bold text-foreground">{total}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LogsHistogram({ data, className }: LogsHistogramProps) {
  return (
    <div className={`px-4 pt-2 pb-0 ${className ?? ""}`}>
      <ResponsiveContainer width="100%" height={52}>
        <BarChart
          data={data}
          barSize={6}
          barGap={1}
          barCategoryGap={3}
          margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="time"
            tick={{
              fontSize: 9,
              fill: "hsl(var(--muted-foreground) / 0.6)",
              fontFamily: "monospace",
            }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
          />
          {/* Stacked bars: success (bottom) → warning → error (top) */}
          <Bar
            dataKey="success"
            stackId="a"
            fill="hsl(142 71% 45%)"
            name="Success"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="warning"
            stackId="a"
            fill="hsl(38 92% 50%)"
            name="Warning"
          />
          <Bar
            dataKey="error"
            stackId="a"
            fill="hsl(0 84% 60%)"
            name="Error"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
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
  logs: AuditStreamEntry[],
  timeRange?: string
): HistogramBucket[] {
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

  // If logs exist, check if they fall within [rangeStart, rangeEnd].
  // If all logs are outside (e.g. historical data in dev/test), adapt window around the logs.
  const validTimestamps = logs
    .map((l) => new Date(l.timestamp).getTime())
    .filter((t) => !isNaN(t));

  if (validTimestamps.length > 0) {
    const minLogTime = Math.min(...validTimestamps);
    const maxLogTime = Math.max(...validTimestamps);

    const logsInWindow = validTimestamps.filter((t) => t >= rangeStart && t <= rangeEnd).length;
    if (logsInWindow === 0) {
      // Adapt window to cover the logs span with 5% padding
      const logSpan = Math.max(maxLogTime - minLogTime, 5 * 60 * 1000);
      const padding = Math.max(logSpan * 0.05, 60 * 1000);
      rangeStart = minLogTime - padding;
      rangeEnd = maxLogTime + padding;
      totalSpanMs = rangeEnd - rangeStart;
    }
  }

  const bucketMs = Math.max(totalSpanMs / BUCKET_COUNT, 1000);

  // Generate bucket slots
  const buckets: HistogramBucket[] = Array.from({ length: BUCKET_COUNT }, (_, i) => {
    const bucketTime = new Date(rangeStart + i * bucketMs);
    return {
      time: formatBucketLabel(bucketTime, totalSpanMs),
      success: 0,
      warning: 0,
      error: 0,
    };
  });

  // Bin logs into buckets
  logs.forEach((log) => {
    const logTime = new Date(log.timestamp).getTime();
    if (isNaN(logTime) || logTime < rangeStart || logTime > rangeEnd) return;

    let bucketIdx = Math.floor((logTime - rangeStart) / bucketMs);
    if (bucketIdx < 0) bucketIdx = 0;
    if (bucketIdx >= BUCKET_COUNT) bucketIdx = BUCKET_COUNT - 1;

    const severity = log.severity?.toUpperCase();
    if (severity === "ERROR" || severity === "CRITICAL" || log.status === "FAILED") {
      buckets[bucketIdx].error++;
    } else if (severity === "WARN" || severity === "WARNING") {
      buckets[bucketIdx].warning++;
    } else {
      buckets[bucketIdx].success++;
    }
  });

  return buckets;
}
