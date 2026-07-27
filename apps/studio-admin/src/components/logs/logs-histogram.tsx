"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AuditStreamEntry } from "@/hooks/use-audit-log-stream";

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
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-emerald-400">Success</span>
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

/**
 * Generates 20 histogram buckets (3-minute intervals covering ~1h).
 * Matches Supabase Studio's TimelineChart bucket approach.
 * Falls back to a demo sine-wave pattern when no log data is present.
 */
export function buildHistogramData(logs: AuditStreamEntry[]): HistogramBucket[] {
  const now = Date.now();
  const BUCKET_COUNT = 20;
  const BUCKET_MS = 3 * 60 * 1000; // 3 minutes per bucket

  // Create 20 empty time-labelled buckets going back in time
  const buckets: HistogramBucket[] = Array.from({ length: BUCKET_COUNT }, (_, i) => {
    const bucketTime = new Date(now - (BUCKET_COUNT - 1 - i) * BUCKET_MS);
    const hh = bucketTime.getHours().toString().padStart(2, "0");
    const mm = bucketTime.getMinutes().toString().padStart(2, "0");
    return { time: `${hh}:${mm}`, success: 0, warning: 0, error: 0 };
  });

  // Bin each log into its corresponding 3-minute bucket
  logs.forEach((log) => {
    const logTime = new Date(log.timestamp).getTime();
    const msAgo = now - logTime;
    if (msAgo < 0 || msAgo > BUCKET_COUNT * BUCKET_MS) return;

    const bucketIdx = BUCKET_COUNT - 1 - Math.floor(msAgo / BUCKET_MS);
    if (bucketIdx < 0 || bucketIdx >= BUCKET_COUNT) return;

    const severity = log.severity?.toUpperCase();
    if (severity === "ERROR" || severity === "CRITICAL") {
      buckets[bucketIdx].error++;
    } else if (severity === "WARN" || severity === "WARNING") {
      buckets[bucketIdx].warning++;
    } else {
      buckets[bucketIdx].success++;
    }
  });

  // Fallback demo pattern when no real data is available
  const hasData = buckets.some((b) => b.success + b.warning + b.error > 0);
  if (!hasData) {
    return buckets.map((b, i) => ({
      ...b,
      success: Math.floor(Math.sin(i * 0.5) * 4 + 5),
      warning: i % 7 === 0 ? 2 : 0,
      error:   i % 11 === 0 ? 1 : 0,
    }));
  }

  return buckets;
}
