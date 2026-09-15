import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type { EventSchema, SimulateEventResponse, DeadLetterLog, ApiAnalytics } from "./types";

export function useOrgSimulatorAndDlq(orgIdentifier: string) {
  const [eventSchemas, setEventSchemas] = useState<EventSchema[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);

  const [dlqLogs, setDlqLogs] = useState<DeadLetterLog[]>([]);
  const [loadingDlq, setLoadingDlq] = useState(false);

  const [apiAnalytics, setApiAnalytics] = useState<ApiAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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

  const fetchApiAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-analytics`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setApiAnalytics(data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch API analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [orgIdentifier]);

  useEffect(() => {
    fetchEventSchemas();
    fetchDlqLogs();
    fetchApiAnalytics();
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
    refreshAnalytics: fetchApiAnalytics,
  };
}
