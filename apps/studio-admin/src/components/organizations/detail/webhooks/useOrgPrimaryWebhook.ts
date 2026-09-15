import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type {
  WebhookSubscriptions,
  WebhookConfigData,
} from "./types";
import { useOrgWebhookPing } from "./useOrgWebhookPing";

interface RawDeliveryLog {
  id?: string;
  event?: string;
  eventName?: string;
  targetUrl?: string;
  status?: number;
  httpStatus?: number;
  latencyMs?: number;
  responseBody?: string;
  errorMessage?: string;
  createdAt?: string;
}

export function useOrgPrimaryWebhook(orgIdentifier: string) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecretMasked, setWebhookSecretMasked] = useState<string | null>(null);
  const [hasSecret, setHasSecret] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [subscribedEvents, setSubscribedEvents] = useState<WebhookSubscriptions>({
    fiberCut: true,
    oltDown: true,
    odpFull: true,
    quotaAlert: false,
  });
  const [initialConfig, setInitialConfig] = useState<WebhookConfigData | null>(null);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isRollingSecret, setIsRollingSecret] = useState(false);
  const [newRolledSecret, setNewRolledSecret] = useState<string | null>(null);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const {
    testingPing,
    lastPingResult,
    deliveryLogs,
    setDeliveryLogs,
    handleTestPing,
  } = useOrgWebhookPing(orgIdentifier, webhookUrl);

  const fetchConfigAndLogs = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const headers = getAuthHeaders();

      const [configRes, logsRes] = await Promise.all([
        fetch(`/api/v1/organizations/${orgIdentifier}/webhook-config`, { headers }),
        fetch(`/api/v1/organizations/${orgIdentifier}/webhook-logs`, { headers }),
      ]);

      if (configRes.ok) {
        const configData: WebhookConfigData = await configRes.json();
        setWebhookUrl(configData.webhookUrl || "");
        setWebhookSecretMasked(configData.webhookSecretMasked);
        setHasSecret(configData.hasSecret);
        setIsActive(configData.isActive);
        if (configData.subscribedEvents) {
          setSubscribedEvents(configData.subscribedEvents);
        }
        setInitialConfig(configData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (Array.isArray(logsData)) {
          setDeliveryLogs(
            logsData.map((l: RawDeliveryLog) => ({
              id: l.id || `log-${Math.random()}`,
              event: l.event || l.eventName || "webhook.delivery",
              targetUrl: l.targetUrl || "",
              status: l.status || l.httpStatus || 0,
              latencyMs: l.latencyMs || 0,
              responseBody: l.responseBody,
              errorMessage: l.errorMessage,
              timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString("id-ID") : "Baru saja",
            }))
          );
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load webhook config/logs:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, [orgIdentifier, setDeliveryLogs]);

  useEffect(() => {
    fetchConfigAndLogs();
  }, [fetchConfigAndLogs]);

  const handleSaveWebhook = useCallback(async () => {
    try {
      setIsSavingWebhook(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhook-config`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim() || null,
          isActive,
          subscribedEvents,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menyimpan konfigurasi Webhook.");
      }

      const data: WebhookConfigData = await res.json();
      setWebhookUrl(data.webhookUrl || "");
      setWebhookSecretMasked(data.webhookSecretMasked);
      setHasSecret(data.hasSecret);
      setIsActive(data.isActive);
      if (data.subscribedEvents) {
        setSubscribedEvents(data.subscribedEvents);
      }
      setInitialConfig(data);

      toast.success("Konfigurasi Webhook NOC berhasil disimpan.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan konfigurasi Webhook.";
      toast.error(msg);
    } finally {
      setIsSavingWebhook(false);
    }
  }, [orgIdentifier, webhookUrl, isActive, subscribedEvents]);

  const handleRollSecret = useCallback(async () => {
    try {
      setIsRollingSecret(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhooks/roll-secret`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal memperbarui secret HMAC.");
      }

      const data = await res.json();
      setNewRolledSecret(data.plainTextSecret);
      setWebhookSecretMasked(data.webhookSecretMasked);
      setHasSecret(true);
      setIsSecretModalOpen(true);

      toast.success("Secret HMAC baru berhasil dibuat.", {
        description: "Salin secret baru untuk diverifikasi pada endpoint NOC Anda.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui secret.";
      toast.error(msg);
    } finally {
      setIsRollingSecret(false);
    }
  }, [orgIdentifier]);

  const isDirty = initialConfig
    ? (initialConfig.webhookUrl || "") !== webhookUrl ||
      JSON.stringify(initialConfig.subscribedEvents) !== JSON.stringify(subscribedEvents)
    : false;

  return {
    webhookUrl,
    setWebhookUrl,
    webhookSecretMasked,
    hasSecret,
    isActive,
    setIsActive,
    subscribedEvents,
    setSubscribedEvents,
    isDirty,
    isSavingWebhook,
    isRollingSecret,
    newRolledSecret,
    setNewRolledSecret,
    isSecretModalOpen,
    setIsSecretModalOpen,
    testingPing,
    lastPingResult,
    deliveryLogs,
    loadingConfig,
    handleSaveWebhook,
    handleRollSecret,
    handleTestPing,
    fetchConfigAndLogs,
  };
}
