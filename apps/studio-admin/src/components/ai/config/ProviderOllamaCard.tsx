import React from "react";
import { Server, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button, Input, Label, Badge } from "@k2net/ui";
import type { ModelCatalogItem } from "@/lib/actions/gateways";
import type { ProviderTestState } from "./useAiConfigProviders";

interface ProviderOllamaCardProps {
  config: Record<string, string>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  testState?: ProviderTestState;
  models: ModelCatalogItem[];
  loadingModels: boolean;
  defaultProvider: string;
  onTest: () => void;
  onRefreshModels: () => void;
}

export function ProviderOllamaCard({
  config,
  setConfig,
  testState,
  models,
  loadingModels,
  defaultProvider,
  onTest,
  onRefreshModels,
}: ProviderOllamaCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
      <div>
        <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">4. Local Ollama Engine</h3>
                {defaultProvider === "ollama" && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono px-1.5 py-0">
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                On-Premise Private AI (No Cloud Keys)
              </p>
            </div>
          </div>

          <div>
            {testState?.success ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Online ({testState.latency_ms}ms)
              </Badge>
            ) : testState?.error ? (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                <AlertCircle className="w-3 h-3" /> Offline
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] font-mono">
                On-Premise
              </Badge>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ollamaUrl" className="text-xs font-medium text-foreground">
              Ollama Base URL Endpoint
            </Label>
            <Input
              id="ollamaUrl"
              type="text"
              value={config["OLLAMA_BASE_URL"] || "http://host.docker.internal:11434/v1"}
              onChange={(e) => setConfig({ ...config, OLLAMA_BASE_URL: e.target.value })}
              placeholder="http://host.docker.internal:11434/v1"
              className="text-xs h-8 font-mono bg-background border-border"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ollamaModel" className="text-xs font-medium text-foreground">
                Model Name (Installed on Server)
              </Label>
              <button
                type="button"
                onClick={onRefreshModels}
                disabled={loadingModels}
                className="text-[11px] text-primary/80 hover:text-primary flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingModels ? "animate-spin" : ""}`} />
                <span>Scan Ollama Models ({models.length})</span>
              </button>
            </div>

            <select
              id="ollamaModel"
              value={config["OLLAMA_CHAT_MODEL"] || "llama3.2"}
              onChange={(e) => setConfig({ ...config, OLLAMA_CHAT_MODEL: e.target.value })}
              className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden focus:ring-1 focus:ring-primary"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testState?.loading}
          className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
        >
          {testState?.loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Server className="w-3 h-3 text-purple-400" />
          )}
          <span>Tes Daemon</span>
        </Button>

        <Button
          type="button"
          variant={defaultProvider === "ollama" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "ollama" })}
          className="text-xs h-7 cursor-pointer"
        >
          {defaultProvider === "ollama" ? "✓ Utama" : "Set Utama"}
        </Button>
      </div>
    </div>
  );
}
