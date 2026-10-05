import { useState, useEffect } from "react";
import {
  LogsHistogramCore,
  mapAnalyticsSummaryToBuckets,
  buildHistogramDataFromLogs,
  type HistogramBucket,
  type HourlySummaryItem,
  type LogsHistogramCoreProps,
} from "@k2net/ui";
import { type AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import { getAuthHeaders } from "@/lib/actions/gateways/common";

export type { HistogramBucket, HourlySummaryItem };

export type LogsHistogramProps = LogsHistogramCoreProps;

export function LogsHistogram(props: LogsHistogramProps) {
  return <LogsHistogramCore {...props} />;
}

export { mapAnalyticsSummaryToBuckets };

export function buildHistogramData(
  logs: AuditStreamEntry[] = [],
  timeRange?: string
): HistogramBucket[] {
  return buildHistogramDataFromLogs<AuditStreamEntry>(logs, timeRange);
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
