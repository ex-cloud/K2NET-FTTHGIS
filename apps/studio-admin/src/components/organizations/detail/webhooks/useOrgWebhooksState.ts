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
  ScopedToken,
  WebhookEndpoint,
  EventSchema,
  SimulateEventResponse,
  DeadLetterLog,
  ApiAnalytics,
} from "./types";

export function useOrgWebhooksState(org: EnrichedOrganization) {
  const orgIdentifier = org.slug || org.id;

  // 1. Kong Consumer API Key State
  const [apiKeyOverview, setApiKeyOverview] = useState<ApiKeyOverview | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // 2. Primary Webhook Config State
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

  // 3. Test Ping & Delivery Logs State
  const [testingPing, setTestingPing] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<PingResult | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);

  // 4. Scoped API Tokens State
  const [scopedTokens, setScopedTokens] = useState<ScopedToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [newGeneratedToken, setNewGeneratedToken] = useState<string | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // 5. Multi-Endpoint Router State
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loadingEndpoints, setLoadingEndpoints] = useState(false);

  // 6. Event Catalog & Payload Simulator State
  const [eventSchemas, setEventSchemas] = useState<EventSchema[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);

  // 7. Dead Letter Queue (DLQ) State
  const [dlqLogs, setDlqLogs] = useState<DeadLetterLog[]>([]);
  const [loadingDlq, setLoadingDlq] = useState(false);

  // 8. API Analytics State
  const [apiAnalytics, setApiAnalytics] = useState<ApiAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [loading, setLoading] = useState(true);

  // Fetch initial base data
  const fetchBaseData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

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

  // Fetch Scoped Tokens
  const fetchScopedTokens = useCallback(async () => {
    try {
      setLoadingTokens(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-tokens`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setScopedTokens(data);
      }
    } catch (err) {
      console.error("Failed to fetch scoped tokens:", err);
    } finally {
      setLoadingTokens(false);
    }
  }, [orgIdentifier]);

  // Fetch Multi-Endpoints
  const fetchEndpoints = useCallback(async () => {
    try {
      setLoadingEndpoints(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhook-endpoints`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookEndpoints(data);
      }
    } catch (err) {
      console.error("Failed to fetch webhook endpoints:", err);
    } finally {
      setLoadingEndpoints(false);
    }
  }, [orgIdentifier]);

  // Fetch Event Schemas
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
    } catch (err) {
      console.error("Failed to fetch event schemas:", err);
    } finally {
      setLoadingSchemas(false);
    }
  }, [orgIdentifier]);

  // Fetch DLQ Logs
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
    } catch (err) {
      console.error("Failed to fetch DLQ logs:", err);
    } finally {
      setLoadingDlq(false);
    }
  }, [orgIdentifier]);

  // Fetch API Analytics
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
    } catch (err) {
      console.error("Failed to fetch API analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [orgIdentifier]);

  useEffect(() => {
    fetchBaseData();
    fetchScopedTokens();
    fetchEndpoints();
    fetchEventSchemas();
    fetchDlqLogs();
    fetchApiAnalytics();
  }, [fetchBaseData, fetchScopedTokens, fetchEndpoints, fetchEventSchemas, fetchDlqLogs, fetchApiAnalytics]);

  // Copy helper
  const handleCopy = useCallback((text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard.`);
  }, []);

  // Regenerate Primary API Key
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

  // Save Primary Webhook Config
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

  // Roll Primary Webhook HMAC Secret
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

  // Test Ping Primary Webhook
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
    } catch (err: any) {
      toast.error("Test Ping Gagal", {
        description: err.message || "Pastikan URL target valid dan dapat diakses melalui HTTPS.",
      });
    } finally {
      setTestingPing(false);
    }
  }, [orgIdentifier, webhookUrl]);

  // 4. Scoped Tokens Actions
  const handleCreateScopedToken = useCallback(
    async (data: { name: string; scopes: string[]; expiresInDays: number | null }) => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-tokens`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal membuat Scoped Token.");
        }

        const created = await res.json();
        setNewGeneratedToken(created.token);
        setIsTokenModalOpen(true);
        fetchScopedTokens();

        toast.success("Scoped API Token berhasil diterbitkan.", {
          description: "Salin token sekarang sebelum modal ditutup.",
        });
      } catch (err: any) {
        toast.error(err.message || "Gagal membuat token.");
        throw err;
      }
    },
    [orgIdentifier, fetchScopedTokens]
  );

  const handleRevokeScopedToken = useCallback(
    async (tokenId: string) => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-tokens/${tokenId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error("Gagal mencabut token.");
        }

        toast.success("Scoped Token berhasil dicabut (revoked).");
        fetchScopedTokens();
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat mencabut token.");
        throw err;
      }
    },
    [orgIdentifier, fetchScopedTokens]
  );

  // 5. Multi-Endpoint Actions
  const handleCreateEndpoint = useCallback(
    async (data: {
      name: string;
      targetUrl: string;
      description: string;
      subscribedEvents: WebhookSubscriptions;
      isActive: boolean;
    }) => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhook-endpoints`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal menambahkan webhook endpoint.");
        }

        toast.success("Webhook Endpoint berhasil ditambahkan.");
        fetchEndpoints();
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat membuat endpoint.");
        throw err;
      }
    },
    [orgIdentifier, fetchEndpoints]
  );

  const handleUpdateEndpoint = useCallback(
    async (
      id: string,
      data: {
        name: string;
        targetUrl: string;
        description: string;
        subscribedEvents: WebhookSubscriptions;
        isActive: boolean;
      }
    ) => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhook-endpoints/${id}`, {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal memperbarui webhook endpoint.");
        }

        toast.success("Webhook Endpoint berhasil diperbarui.");
        fetchEndpoints();
      } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui endpoint.");
        throw err;
      }
    },
    [orgIdentifier, fetchEndpoints]
  );

  const handleDeleteEndpoint = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/v1/organizations/${orgIdentifier}/webhook-endpoints/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error("Gagal menghapus endpoint.");
        }

        toast.success("Webhook Endpoint berhasil dihapus.");
        fetchEndpoints();
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat menghapus endpoint.");
        throw err;
      }
    },
    [orgIdentifier, fetchEndpoints]
  );

  const handleRollEndpointSecret = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `/api/v1/organizations/${orgIdentifier}/webhook-endpoints/${id}/roll-secret`,
          {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal memperbarui secret endpoint.");
        }

        const data = await res.json();
        setNewRolledSecret(data.plainTextSecret);
        setIsSecretModalOpen(true);
        fetchEndpoints();

        toast.success("HMAC Secret endpoint berhasil di-roll.");
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat roll secret.");
        throw err;
      }
    },
    [orgIdentifier, fetchEndpoints]
  );

  const handleTestPingEndpoint = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `/api/v1/organizations/${orgIdentifier}/webhook-endpoints/${id}/test-ping`,
          {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || `Test ping gagal (HTTP ${res.status}).`);
        }

        if (data.success) {
          toast.success(`Test Ping berhasil! HTTP ${data.status} (${data.latencyMs}ms).`);
        } else {
          toast.error(`Endpoint merespons HTTP ${data.status}.`);
        }

        return {
          status: data.status,
          latencyMs: data.latencyMs,
          success: data.success,
          errorMessage: data.errorMessage,
        };
      } catch (err: any) {
        toast.error(err.message || "Test ping gagal.");
        throw err;
      }
    },
    [orgIdentifier]
  );

  // 6. Payload Simulation Action
  const handleSimulateEvent = useCallback(
    async (data: {
      eventType: string;
      targetUrl: string;
      customPayloadJson?: string;
    }): Promise<SimulateEventResponse> => {
      try {
        const res = await fetch(
          `/api/v1/organizations/${orgIdentifier}/webhooks/simulate-event`,
          {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(data),
          }
        );

        const result: SimulateEventResponse = await res.json();
        if (result.success) {
          toast.success(`Simulasi Event Berhasil: HTTP ${result.httpStatus} (${result.latencyMs}ms).`);
        } else {
          toast.error(`Simulasi Event Gagal: HTTP ${result.httpStatus || "ERR"}`, {
            description: result.errorMessage || undefined,
          });
        }
        return result;
      } catch (err: any) {
        toast.error(err.message || "Gagal melakukan simulasi event dispatch.");
        throw err;
      }
    },
    [orgIdentifier]
  );

  // 7. Dead Letter Queue Actions
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
      } catch (err: any) {
        toast.error(err.message || "Gagal mengirim ulang webhook.");
        throw err;
      }
    },
    [orgIdentifier]
  );

  const isDirty = initialConfig
    ? (initialConfig.webhookUrl || "") !== webhookUrl ||
      JSON.stringify(initialConfig.subscribedEvents) !== JSON.stringify(subscribedEvents)
    : false;

  return {
    loading,
    // Base Key & Webhooks
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
    refreshData: fetchBaseData,

    // Phase 3 Features
    scopedTokens,
    loadingTokens,
    newGeneratedToken,
    isTokenModalOpen,
    setIsTokenModalOpen,
    handleCreateScopedToken,
    handleRevokeScopedToken,

    webhookEndpoints,
    loadingEndpoints,
    handleCreateEndpoint,
    handleUpdateEndpoint,
    handleDeleteEndpoint,
    handleRollEndpointSecret,
    handleTestPingEndpoint,

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
