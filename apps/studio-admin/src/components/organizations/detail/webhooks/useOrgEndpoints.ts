import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type { WebhookEndpoint, WebhookSubscriptions } from "./types";

export function useOrgEndpoints(
  orgIdentifier: string,
  onNewSecret?: (secret: string) => void
) {
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loadingEndpoints, setLoadingEndpoints] = useState(false);

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
    } catch (err: unknown) {
      console.error("Failed to fetch webhook endpoints:", err);
    } finally {
      setLoadingEndpoints(false);
    }
  }, [orgIdentifier]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat endpoint.";
        toast.error(msg);
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memperbarui endpoint.";
        toast.error(msg);
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus endpoint.";
        toast.error(msg);
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
        if (onNewSecret) {
          onNewSecret(data.plainTextSecret);
        }
        fetchEndpoints();

        toast.success("HMAC Secret endpoint berhasil di-roll.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat roll secret.";
        toast.error(msg);
        throw err;
      }
    },
    [orgIdentifier, fetchEndpoints, onNewSecret]
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
          timestamp: "Baru saja",
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Test ping gagal.";
        toast.error(msg);
        throw err;
      }
    },
    [orgIdentifier]
  );

  return {
    webhookEndpoints,
    loadingEndpoints,
    handleCreateEndpoint,
    handleUpdateEndpoint,
    handleDeleteEndpoint,
    handleRollEndpointSecret,
    handleTestPingEndpoint,
    fetchEndpoints,
  };
}
