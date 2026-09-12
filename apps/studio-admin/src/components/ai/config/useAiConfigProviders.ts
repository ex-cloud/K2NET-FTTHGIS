import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  testAiProviderConnection,
  fetchAiProviderModels,
  type ModelCatalogItem,
} from "@/lib/actions/gateways";

export type ProviderTestState = {
  loading: boolean;
  success?: boolean;
  latency_ms?: number;
  message?: string;
  error?: string;
};

export function useAiConfigProviders(config: Record<string, string>) {
  const [testStates, setTestStates] = useState<Record<string, ProviderTestState>>({});
  const [providerModels, setProviderModels] = useState<Record<string, ModelCatalogItem[]>>({});
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const [detectedLiveMap, setDetectedLiveMap] = useState<Record<string, boolean>>({});

  const loadModelsForProvider = useCallback(
    async (provider: string, apiKey?: string, baseUrl?: string) => {
      try {
        setLoadingModels((prev) => ({ ...prev, [provider]: true }));
        const res = await fetchAiProviderModels(provider, apiKey, baseUrl);
        if (res && res.models && res.models.length > 0) {
          setProviderModels((prev) => ({ ...prev, [provider]: res.models }));
          setDetectedLiveMap((prev) => ({ ...prev, [provider]: res.detected_live }));
        }
      } catch (err) {
        console.warn(`Failed to fetch models for ${provider}:`, err);
      } finally {
        setLoadingModels((prev) => ({ ...prev, [provider]: false }));
      }
    },
    []
  );

  useEffect(() => {
    loadModelsForProvider("gemini", config["GEMINI_API_KEY"]);
    loadModelsForProvider("openai", config["OPENAI_API_KEY"]);
    loadModelsForProvider("deepseek", config["DEEPSEEK_API_KEY"], config["DEEPSEEK_BASE_URL"]);
    loadModelsForProvider("ollama", undefined, config["OLLAMA_BASE_URL"]);
  }, [loadModelsForProvider, config]);

  const handleTestProvider = async (provider: "gemini" | "openai" | "deepseek" | "ollama") => {
    setTestStates((prev) => ({
      ...prev,
      [provider]: { loading: true },
    }));

    try {
      let apiKey = "";
      let baseUrl = "";
      let model = "";

      if (provider === "gemini") {
        apiKey = config["GEMINI_API_KEY"] || "";
        model = config["GEMINI_CHAT_MODEL"] || "gemini-2.5-flash";
      } else if (provider === "openai") {
        apiKey = config["OPENAI_API_KEY"] || "";
        model = config["OPENAI_CHAT_MODEL"] || "gpt-4o-mini";
      } else if (provider === "deepseek") {
        apiKey = config["DEEPSEEK_API_KEY"] || "";
        baseUrl = config["DEEPSEEK_BASE_URL"] || "https://api.deepseek.com/v1";
        model = config["DEEPSEEK_CHAT_MODEL"] || "deepseek-chat";
      } else if (provider === "ollama") {
        baseUrl = config["OLLAMA_BASE_URL"] || "http://host.docker.internal:11434/v1";
        model = config["OLLAMA_CHAT_MODEL"] || "llama3.2";
      }

      const res = await testAiProviderConnection({
        provider,
        api_key: apiKey,
        base_url: baseUrl,
        model,
      });

      if (res.success) {
        setTestStates((prev) => ({
          ...prev,
          [provider]: {
            loading: false,
            success: true,
            latency_ms: res.latency_ms,
            message: res.message,
          },
        }));
        toast.success(`Koneksi ke ${provider.toUpperCase()} berhasil! Latency: ${res.latency_ms}ms`);
        loadModelsForProvider(provider, apiKey, baseUrl);
      } else {
        setTestStates((prev) => ({
          ...prev,
          [provider]: {
            loading: false,
            success: false,
            latency_ms: res.latency_ms,
            error: res.message,
          },
        }));
        toast.error(`Koneksi ${provider.toUpperCase()} gagal: ${res.message}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Gagal menguji koneksi.";
      setTestStates((prev) => ({
        ...prev,
        [provider]: {
          loading: false,
          success: false,
          error: errMsg,
        },
      }));
      toast.error(errMsg);
    }
  };

  return {
    testStates,
    providerModels,
    loadingModels,
    detectedLiveMap,
    loadModelsForProvider,
    handleTestProvider,
  };
}
