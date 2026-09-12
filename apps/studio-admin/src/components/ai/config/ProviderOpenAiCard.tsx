import React, { useState } from "react";
import { Bot, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { Button, Input, Label, Badge } from "@k2net/ui";
import type { ModelCatalogItem } from "@/lib/actions/gateways";
import type { ProviderTestState } from "./useAiConfigProviders";

interface ProviderOpenAiCardProps {
  config: Record<string, string>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  testState?: ProviderTestState;
  models: ModelCatalogItem[];
  defaultProvider: string;
  fallbackProvider: string;
  onTest: () => void;
}

export function ProviderOpenAiCard({
  config,
  setConfig,
  testState,
  models,
  defaultProvider,
  fallbackProvider,
  onTest,
}: ProviderOpenAiCardProps) {
  const [showKey, setShowKey] = useState(false);
  const isKeyConfigured = Boolean(config["OPENAI_API_KEY"] && config["OPENAI_API_KEY"].trim() !== "");

  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
      <div>
        <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">2. OpenAI (GPT-4o / o3-mini)</h3>
                {defaultProvider === "openai" && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono px-1.5 py-0">
                    Primary
                  </Badge>
                )}
                {fallbackProvider === "openai" && defaultProvider !== "openai" && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] font-mono px-1.5 py-0">
                    Auto-Fallback
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Standar Industri & Auto-Fallback Provider
              </p>
            </div>
          </div>

          <div>
            {testState?.success ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> {testState.latency_ms}ms
              </Badge>
            ) : testState?.error ? (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                <AlertCircle className="w-3 h-3" /> Error
              </Badge>
            ) : isKeyConfigured ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-mono gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                Not Configured
              </Badge>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="openaiKey" className="text-xs font-medium text-foreground">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                id="openaiKey"
                type={showKey ? "text" : "password"}
                value={config["OPENAI_API_KEY"] || ""}
                onChange={(e) => setConfig({ ...config, OPENAI_API_KEY: e.target.value })}
                placeholder="sk-proj-..."
                className="text-xs h-8 pr-8 font-mono bg-background border-border"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="openaiModel" className="text-xs font-medium text-foreground">
              Model Generasi
            </Label>
            <select
              id="openaiModel"
              value={config["OPENAI_CHAT_MODEL"] || "gpt-4o-mini"}
              onChange={(e) => setConfig({ ...config, OPENAI_CHAT_MODEL: e.target.value })}
              className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden focus:ring-1 focus:ring-primary"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} {m.badge ? `[${m.badge}]` : ""} — {m.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="gpt-4o-mini">gpt-4o-mini [Fast] — Hemat Biaya & Ringan</option>
                  <option value="gpt-4o">gpt-4o [Flagship] — Multimodal Kompleks</option>
                  <option value="o3-mini">o3-mini [Reasoning] — STEM & Logika</option>
                  <option value="o1">o1 [Deep Reasoning] — Penalaran Maksimal</option>
                </>
              )}
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
          disabled={testState?.loading || !config["OPENAI_API_KEY"]}
          className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
        >
          {testState?.loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Zap className="w-3 h-3 text-primary" />
          )}
          <span>Tes Koneksi</span>
        </Button>

        <Button
          type="button"
          variant={defaultProvider === "openai" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "openai" })}
          className="text-xs h-7 cursor-pointer"
        >
          {defaultProvider === "openai" ? "✓ Utama" : "Set Utama"}
        </Button>
      </div>
    </div>
  );
}
