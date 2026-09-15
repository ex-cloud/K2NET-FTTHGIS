import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type { EnrichedOrganization } from "../../types";
import type {
  WebhookDeliveryLog,
  WebhookSubscriptions,
  PingResult,
  ApiKeyOverview,
  WebhookConfigData,
} from "./types";

export function useOrgWebhooksState(org: EnrichedOrganization) {
  const orgIdentifier = org.slug || org.id;

  // API Key State
  const [apiKeyOverview, setApiKeyOverview] = useState<ApiKeyOverview | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Webhook Config State
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

  // Test Ping & Delivery Logs State
  const [testingPing, setTestingPing] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<PingResult | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial API Key, Webhook Config, and Delivery Logs
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Parallel fetch from Spring Boot REST API
      const [keyRes, configRes, logsRes] = await Promise.all([
        fetch(`/api/v1/organizations/${orgIdentifier}/api-key`, { headers }),
        fetch(`/api/v1/organizations/${orgIdentifier}/webhook-config`, { headers }),
        fetch(`/api/v1/organizations/${orgIdentifier}/webhook-logs`, { headers }),
      ]);

      if (keyRes.ok) {
        const keyData: ApiKeyOverview = await keyRes.json();
        setApiKeyOverview(keyData);
      }

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
            logsData.map((l: any) => ({
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
    } catch (err: any) {
      console.error("Failed to load organization webhook details:", err);
      toast.error("Gagal memuat data API & Webhook organisasi.");
    } finally {
      setLoading(false);
    }
  }, [orgIdentifier]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Copy helper
  const handleCopy = useCallback((text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard.`);
  }, []);

  // Regenerate API Key (Show-Once Pattern)
  const handleRegenerateKey = useCallback(async () => {
    try {
      setIsRegenerating(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-key/regenerate`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal meregenerasi API Key.");
      }

      const data = await res.json();
      setNewGeneratedKey(data.plainTextApiKey);
      setIsKeyModalOpen(true);
      setApiKeyOverview({
        apiKeyPrefix: data.apiKeyPrefix,
        apiKeyLast4: data.apiKeyLast4,
        maskedApiKey: data.maskedApiKey,
        rateLimitPerMinute: data.rateLimitPerMinute || 5000,
        hasActiveKey: true,
        createdAt: apiKeyOverview?.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });

      toast.success("API Key baru berhasil diterbitkan.", {
        description: "Salin dan simpan API key sekarang sebelum modal ditutup.",
      });
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat meregenerasi API Key.");
    } finally {
      setIsRegenerating(false);
    }
  }, [orgIdentifier, apiKeyOverview]);

  // Save Webhook Configuration
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
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan konfigurasi Webhook.");
    } finally {
      setIsSavingWebhook(false);
    }
  }, [orgIdentifier, webhookUrl, isActive, subscribedEvents]);

  // Roll HMAC Secret (Show-Once Pattern)
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
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memperbarui secret.");
    } finally {
      setIsRollingSecret(false);
    }
  }, [orgIdentifier]);

  // Real Test Ping with SSRF Validation and Latency Measurement
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

      // Prepend to delivery logs
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
    } catch (err: any) {
      toast.error("Test Ping Gagal", {
        description: err.message || "Pastikan URL target valid dan dapat diakses melalui HTTPS.",
      });
    } finally {
      setTestingPing(false);
    }
  }, [orgIdentifier, webhookUrl]);

  // Dirty state calculation for webhook config form
  const isDirty = initialConfig
    ? (initialConfig.webhookUrl || "") !== webhookUrl ||
      JSON.stringify(initialConfig.subscribedEvents) !== JSON.stringify(subscribedEvents)
    : false;

  return {
    loading,
    apiKeyOverview,
    showKey,
    setShowKey,
    isRegenerating,
    newGeneratedKey,
    isKeyModalOpen,
    setIsKeyModalOpen,
    webhookUrl,
    setWebhookUrl,
    webhookSecretMasked,
    hasSecret,
    isRollingSecret,
    newRolledSecret,
    isSecretModalOpen,
    setIsSecretModalOpen,
    subscribedEvents,
    setSubscribedEvents,
    isDirty,
    isSavingWebhook,
    testingPing,
    lastPingResult,
    deliveryLogs,
    handleCopy,
    handleRegenerateKey,
    handleSaveWebhook,
    handleRollSecret,
    handleTestPing,
    refreshData: fetchAllData,
  };
}
