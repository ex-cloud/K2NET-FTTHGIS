import React, { useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, RefreshCw, Loader2, Zap } from "lucide-react";
import { Button, Input, Label, Badge } from "@k2net/ui";
import type { ModelCatalogItem } from "@/lib/actions/gateways";
import type { ProviderTestState } from "./useAiConfigProviders";

interface ProviderGeminiCardProps {
  config: Record<string, string>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  testState?: ProviderTestState;
  models: ModelCatalogItem[];
  loadingModels: boolean;
  detectedLive: boolean;
  defaultProvider: string;
  fallbackProvider: string;
  onTest: () => void;
  onRefreshModels: () => void;
}

export function ProviderGeminiCard({
  config,
  setConfig,
  testState,
  models,
  loadingModels,
  detectedLive,
  defaultProvider,
  fallbackProvider,
  onTest,
  onRefreshModels,
}: ProviderGeminiCardProps) {
  const [showKey, setShowKey] = useState(false);
  const isKeyConfigured = Boolean(config["GEMINI_API_KEY"] && config["GEMINI_API_KEY"].trim() !== "");
  const categories = Array.from(new Set(models.map((m) => m.category)));

  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
      <div>
        <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">1. Google Gemini</h3>
                {defaultProvider === "gemini" && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono px-1.5 py-0">
                    Primary
                  </Badge>
                )}
                {fallbackProvider === "gemini" && defaultProvider !== "gemini" && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] font-mono px-1.5 py-0">
                    Fallback
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Google AI Studio & Vertex AI API (Gemini 3 / 2.5)
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
                <CheckCircle2 className="w-3 h-3" /> Configured & Ready
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
            <div className="flex items-center justify-between">
              <Label htmlFor="geminiKey" className="text-xs font-medium text-foreground">
                Gemini API Key
              </Label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary/80 hover:text-primary hover:underline flex items-center gap-1"
              >
                <span>Dapatkan Key di AI Studio</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <Input
                id="geminiKey"
                type={showKey ? "text" : "password"}
                value={config["GEMINI_API_KEY"] || ""}
                onChange={(e) => setConfig({ ...config, GEMINI_API_KEY: e.target.value })}
                placeholder="AIzaSy... (atau biarkan jika sudah tersimpan)"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="geminiModel" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <span>Model Generasi & Penalaran</span>
                {detectedLive && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-primary border-primary/30 bg-primary/10">
                    Live Detected
                  </Badge>
                )}
              </Label>
              <button
                type="button"
                onClick={onRefreshModels}
                disabled={loadingModels}
                className="text-[11px] text-primary/80 hover:text-primary flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Scan model terbaru dari Google AI Studio"
              >
                <RefreshCw className={`w-3 h-3 ${loadingModels ? "animate-spin" : ""}`} />
                <span>Scan Model ({models.length})</span>
              </button>
            </div>

            <select
              id="geminiModel"
              value={config["GEMINI_CHAT_MODEL"] || "gemini-2.5-flash"}
              onChange={(e) => setConfig({ ...config, GEMINI_CHAT_MODEL: e.target.value })}
              className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden focus:ring-1 focus:ring-primary"
            >
              {categories.length > 0 ? (
                categories.map((category) => (
                  <optgroup key={category} label={`── ${category} ──`} className="bg-card text-foreground font-sans font-semibold">
                    {models
                      .filter((m) => m.category === category)
                      .map((m) => {
                        const cleanId = m.id.replace("models/", "");
                        return (
                          <option key={m.id} value={cleanId} className="font-mono text-xs">
                            {cleanId} {m.badge ? `[${m.badge}]` : ""} — {m.name} {m.context_window ? `(${m.context_window})` : ""}
                          </option>
                        );
                      })}
                  </optgroup>
                ))
              ) : (
                <>
                  <optgroup label="── Gemini 3 Series (Next-Gen) ──">
                    <option value="gemini-3.7-flash">gemini-3.7-flash [New] — Gemini 3.7 Flash (1M tokens)</option>
                    <option value="gemini-3.6-flash">gemini-3.6-flash [Stable] — Gemini 3.6 Flash (1M tokens)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash [Stable] — Gemini 3.5 Flash (1M tokens)</option>
                    <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite [Stable] — Gemini 3.5 Flash-Lite (1M tokens)</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview [Preview] — Gemini 3.1 Pro (2M tokens)</option>
                  </optgroup>
                  <optgroup label="── Gemini 2.5 Series (Production) ──">
                    <option value="gemini-2.5-flash">gemini-2.5-flash [Default] — Gemini 2.5 Flash (1M tokens)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro [Stable] — Gemini 2.5 Pro (2M tokens)</option>
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite [Stable] — Gemini 2.5 Flash-Lite (1M tokens)</option>
                  </optgroup>
                  <optgroup label="── Deep Reasoning & Agents ──">
                    <option value="gemini-2.0-flash-thinking-exp">gemini-2.0-flash-thinking-exp [Reasoning] — Chain-of-Thought (1M)</option>
                    <option value="deep-research-preview-04-2026">deep-research-preview-04-2026 [Agent] — Deep Research (2M)</option>
                  </optgroup>
                </>
              )}
            </select>
            <p className="text-[10px] text-muted-foreground">
              Pilihan resmi Google AI Studio. Mendukung Gemini 3.7 Flash, 3.6, 2.5 Pro (2M context), dan Deep Research.
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testState?.loading || !isKeyConfigured}
          className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
        >
          {testState?.loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Zap className="w-3 h-3 text-blue-400" />
          )}
          <span>Tes Koneksi</span>
        </Button>

        <Button
          type="button"
          variant={defaultProvider === "gemini" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "gemini" })}
          className="text-xs h-7 cursor-pointer"
        >
          {defaultProvider === "gemini" ? "✓ Utama" : "Set Utama"}
        </Button>
      </div>
    </div>
  );
}
