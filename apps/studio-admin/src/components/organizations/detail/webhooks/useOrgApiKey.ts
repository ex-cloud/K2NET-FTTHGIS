import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/actions/gateways/common";
import type { ApiKeyOverview } from "./types";

export function useOrgApiKey(orgIdentifier: string) {
  const [apiKeyOverview, setApiKeyOverview] = useState<ApiKeyOverview | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);

  const fetchApiKey = useCallback(async () => {
    try {
      setLoadingKey(true);
      const res = await fetch(`/api/v1/organizations/${orgIdentifier}/api-key`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const keyData: ApiKeyOverview = await res.json();
        setApiKeyOverview(keyData);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch organization API key:", err);
    } finally {
      setLoadingKey(false);
    }
  }, [orgIdentifier]);

  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat meregenerasi API Key.";
      toast.error(msg);
    } finally {
      setIsRegenerating(false);
    }
  }, [orgIdentifier, apiKeyOverview]);

  return {
    apiKeyOverview,
    setApiKeyOverview,
    showKey,
    setShowKey,
    isRegenerating,
    newGeneratedKey,
    isKeyModalOpen,
    setIsKeyModalOpen,
    loadingKey,
    handleRegenerateKey,
    fetchApiKey,
  };
}
