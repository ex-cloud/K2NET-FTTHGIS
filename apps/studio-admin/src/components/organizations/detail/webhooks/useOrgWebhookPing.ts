import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type { PingResult, WebhookDeliveryLog } from "./types";

export function useOrgWebhookPing(orgIdentifier: string, webhookUrl: string) {
  const [testingPing, setTestingPing] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<PingResult | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);

  const handleTestPing = useCallback(async () => {
    if (!webhookUrl.trim()) {
      toast.error("Masukkan Webhook Target Endpoint (HTTPS) terlebih dahulu.");
      return;
    }

    try {
      setTestingPing(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhooks/test-ping`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          targetUrl: webhookUrl.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Test ping gagal (HTTP ${res.status}).`);
      }

      const pingRes: PingResult = {
        status: data.status,
        latencyMs: data.latencyMs,
        success: data.success,
        errorMessage: data.errorMessage,
        timestamp: "Baru saja",
      };
      setLastPingResult(pingRes);

      const newLog: WebhookDeliveryLog = {
        id: `del-${Date.now()}`,
        event: data.eventName || "ping.test_event",
        targetUrl: data.targetUrl || webhookUrl,
        status: data.status,
        latencyMs: data.latencyMs,
        responseBody: data.responseBody,
        errorMessage: data.errorMessage,
        timestamp: "Baru saja",
      };
      setDeliveryLogs((prev) => [newLog, ...prev]);

      if (data.success) {
        toast.success(`Test Ping berhasil! Endpoint NOC merespons HTTP ${data.status}.`, {
          description: `Latency respon: ${data.latencyMs} ms.`,
        });
      } else {
        toast.error(`Endpoint NOC merespons HTTP ${data.status}.`, {
          description: data.errorMessage || "Periksa log endpoint target Anda.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pastikan URL target valid dan dapat diakses melalui HTTPS.";
      toast.error("Test Ping Gagal", {
        description: msg,
      });
    } finally {
      setTestingPing(false);
    }
  }, [orgIdentifier, webhookUrl]);

  return {
    testingPing,
    lastPingResult,
    deliveryLogs,
    setDeliveryLogs,
    handleTestPing,
  };
}
