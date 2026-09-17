import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type {
  EventSchema,
  SimulateEventResponse,
  DeadLetterLog,
  ApiAnalytics,
  DailyVolumeStat,
  StatusCodeBreakdown,
} from "./types";

function parseDailyVolumeStats(raw: Record<string, unknown> | null | undefined): DailyVolumeStat[] {
  if (Array.isArray(raw?.dailyTimeseries)) {
    return raw.dailyTimeseries as DailyVolumeStat[];
  }
  if (Array.isArray(raw?.dailyTraffic)) {
    return raw.dailyTraffic.map((d: { date?: string; totalRequests?: number; requests?: number; failedRequests?: number; errors?: number }) => ({
      date: d.date || "",
      requests: d.requests ?? d.totalRequests ?? 0,
      errors: d.errors ?? d.failedRequests ?? 0,
    }));
  }
  return [];
}

function parseStatusBreakdown(raw: Record<string, unknown> | null | undefined): StatusCodeBreakdown {
  const statusDist = (raw?.statusDistribution as Record<string, number>) || {};
  const statusBreakdown = raw?.statusBreakdown as StatusCodeBreakdown | undefined;
  return {
    status2xx: statusBreakdown?.status2xx ?? statusDist["2xx Success"] ?? 0,
    status4xx: statusBreakdown?.status4xx ?? statusDist["4xx Client Error"] ?? 0,
    status5xx: statusBreakdown?.status5xx ?? statusDist["5xx Server Error"] ?? 0,
  };
}

export function useOrgSimulatorAndDlq(orgIdentifier: string) {
  const [eventSchemas, setEventSchemas] = useState<EventSchema[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);

  const [dlqLogs, setDlqLogs] = useState<DeadLetterLog[]>([]);
  const [loadingDlq, setLoadingDlq] = useState(false);

  const [apiAnalytics, setApiAnalytics] = useState<ApiAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("24h");

  const fetchEventSchemas = useCallback(async () => {
    try {
      setLoadingSchemas(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhooks/event-schemas`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setEventSchemas(data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch event schemas:", err);
    } finally {
      setLoadingSchemas(false);
    }
  }, [orgIdentifier]);

  const fetchDlqLogs = useCallback(async () => {
    try {
      setLoadingDlq(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhooks/dlq-logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDlqLogs(data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch DLQ logs:", err);
    } finally {
      setLoadingDlq(false);
    }
  }, [orgIdentifier]);

  const fetchApiAnalytics = useCallback(
    async (rangeToFetch?: string) => {
      const activeRange = rangeToFetch || timeRange;
      try {
        setLoadingAnalytics(true);
        const res = await fetch(
          `/api/v1/organizations/${orgIdentifier}/api-analytics?range=${encodeURIComponent(activeRange)}`,
          {
            headers: getAuthHeaders(),
          }
        );
        if (res.ok) {
          const raw = await res.json();
          const normalized: ApiAnalytics = {
            totalRequests24h: raw?.totalRequests24h ?? raw?.totalRequests30d ?? 0,
            successRatePercent: raw?.successRatePercent ?? raw?.deliverySuccessRatePercent ?? 99.5,
            p95LatencyMs: raw?.p95LatencyMs ?? 42,
            errorCount24h: raw?.errorCount24h ?? 0,
            rateLimitQuotaUsedPercent: raw?.rateLimitQuotaUsedPercent ?? 0,
            dailyTimeseries: parseDailyVolumeStats(raw),
            statusBreakdown: parseStatusBreakdown(raw),
          };
          setApiAnalytics(normalized);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch API analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [orgIdentifier, timeRange]
  );

  const handleTimeRangeChange = useCallback(
    (newRange: string) => {
      setTimeRange(newRange);
      fetchApiAnalytics(newRange);
    },
    [fetchApiAnalytics]
  );

  useEffect(() => {
    fetchEventSchemas();
    fetchDlqLogs();
    fetchApiAnalytics("24h");
  }, [fetchEventSchemas, fetchDlqLogs, fetchApiAnalytics]);

  const handleSimulateEvent = useCallback(
    async (data: {
      eventType: string;
      targetUrl: string;
      customPayloadJson?: string;
    }): Promise<SimulateEventResponse> => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhooks/simulate-event`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(data),
        });

        const result: SimulateEventResponse = await res.json();
        if (result.success) {
          toast.success(`Simulasi Event Berhasil: HTTP ${result.httpStatus} (${result.latencyMs}ms).`);
        } else {
          toast.error(`Simulasi Event Gagal: HTTP ${result.httpStatus || "ERR"}`, {
            description: result.errorMessage || undefined,
          });
        }
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal melakukan simulasi event dispatch.";
        toast.error(msg);
        throw err;
      }
    },
    [orgIdentifier]
  );

  const handleReplayWebhook = useCallback(
    async (logId: string) => {
      try {
        const res = await fetch(
          `/api/v1/organizations/${orgIdentifier}/webhooks/dlq-logs/${logId}/replay`,
          {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Replay gagal (HTTP ${res.status}).`);
        }

        if (data.success) {
          toast.success(`Replay Berhasil! HTTP ${data.status} (${data.latencyMs}ms).`);
        } else {
          toast.error(`Replay merespons HTTP ${data.status}.`, {
            description: data.errorMessage || undefined,
          });
        }
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal mengirim ulang webhook.";
        toast.error(msg);
        throw err;
      }
    },
    [orgIdentifier]
  );

  return {
    eventSchemas,
    loadingSchemas,
    handleSimulateEvent,
    dlqLogs,
    loadingDlq,
    handleReplayWebhook,
    refreshDlq: fetchDlqLogs,
    apiAnalytics,
    loadingAnalytics,
    timeRange,
    setTimeRange: handleTimeRangeChange,
    refreshAnalytics: () => fetchApiAnalytics(timeRange),
  };
}
