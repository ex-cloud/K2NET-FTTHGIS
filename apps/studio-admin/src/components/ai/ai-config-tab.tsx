import React from "react";
import { Save, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@k2net/ui";
import { useAiConfigProviders } from "./config/useAiConfigProviders";
import { ProviderGeminiCard } from "./config/ProviderGeminiCard";
import { ProviderOpenAiCard } from "./config/ProviderOpenAiCard";
import { ProviderDeepSeekCard } from "./config/ProviderDeepSeekCard";
import { ProviderOllamaCard } from "./config/ProviderOllamaCard";
import { SystemAiParamsCard } from "./config/SystemAiParamsCard";

interface AiConfigTabProps {
  config: Record<string, string>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  configLoading: boolean;
  configSaving: boolean;
  onSaveConfig: (e: React.FormEvent) => void;
}

export function AiConfigTab({
  config,
  setConfig,
  configLoading,
  configSaving,
  onSaveConfig,
}: AiConfigTabProps) {
  const {
    testStates,
    providerModels,
    loadingModels,
    detectedLiveMap,
    loadModelsForProvider,
    handleTestProvider,
  } = useAiConfigProviders(config);

  const defaultProvider = (config["DEFAULT_LLM_PROVIDER"] || "gemini").toLowerCase();
  const fallbackProvider = (config["FALLBACK_LLM_PROVIDER"] || "openai").toLowerCase();

  return (
    <div className="w-full space-y-6">
      {configLoading ? (
        <div className="text-center py-16 text-muted-foreground text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Memuat data konfigurasi provider AI...
        </div>
      ) : (
        <form onSubmit={onSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ProviderGeminiCard
              config={config}
              setConfig={setConfig}
              testState={testStates["gemini"]}
              models={providerModels["gemini"] || []}
              loadingModels={loadingModels["gemini"] || false}
              detectedLive={detectedLiveMap["gemini"] || false}
              defaultProvider={defaultProvider}
              fallbackProvider={fallbackProvider}
              onTest={() => handleTestProvider("gemini")}
              onRefreshModels={() =>
                loadModelsForProvider("gemini", config["GEMINI_API_KEY"])
              }
            />

            <ProviderOpenAiCard
              config={config}
              setConfig={setConfig}
              testState={testStates["openai"]}
              models={providerModels["openai"] || []}
              defaultProvider={defaultProvider}
              fallbackProvider={fallbackProvider}
              onTest={() => handleTestProvider("openai")}
            />

            <ProviderDeepSeekCard
              config={config}
              setConfig={setConfig}
              testState={testStates["deepseek"]}
              defaultProvider={defaultProvider}
              onTest={() => handleTestProvider("deepseek")}
            />

            <ProviderOllamaCard
              config={config}
              setConfig={setConfig}
              testState={testStates["ollama"]}
              models={providerModels["ollama"] || []}
              loadingModels={loadingModels["ollama"] || false}
              defaultProvider={defaultProvider}
              onTest={() => handleTestProvider("ollama")}
              onRefreshModels={() =>
                loadModelsForProvider("ollama", undefined, config["OLLAMA_BASE_URL"])
              }
            />
          </div>

          <SystemAiParamsCard config={config} setConfig={setConfig} />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                Perubahan konfigurasi provider tersimpan di file konfigurasi server dan aktif secara instan.
              </span>
            </div>

            <Button
              type="submit"
              disabled={configSaving}
              className="text-xs gap-2 font-bold px-6 h-9 shadow-xs cursor-pointer w-full sm:w-auto"
            >
              {configSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Seluruh Konfigurasi</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
