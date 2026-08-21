"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Cpu, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Sliders,
  RefreshCw,
  Search,
  ExternalLink,
  Bot,
  Flame
} from "lucide-react";
import { 
  Button, 
  Input, 
  Label,
  Badge 
} from "@k2net/ui";
import { toast } from "sonner";
import { testAiProviderConnection, fetchAiProviderModels, ModelCatalogItem } from "@/lib/actions/gateways";

interface AiConfigTabProps {
  config: Record<string, string>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  configLoading: boolean;
  configSaving: boolean;
  onSaveConfig: (e: React.FormEvent) => void;
}

type ProviderTestState = {
  loading: boolean;
  success?: boolean;
  latency_ms?: number;
  message?: string;
  error?: string;
};

export function AiConfigTab({
  config,
  setConfig,
  configLoading,
  configSaving,
  onSaveConfig,
}: AiConfigTabProps) {
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);

  // Per-provider test states
  const [testStates, setTestStates] = useState<Record<string, ProviderTestState>>({});

  // Dynamic Models per provider
  const [providerModels, setProviderModels] = useState<Record<string, ModelCatalogItem[]>>({});
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const [detectedLiveMap, setDetectedLiveMap] = useState<Record<string, boolean>>({});

  const loadModelsForProvider = useCallback(async (provider: string, apiKey?: string, baseUrl?: string) => {
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
  }, []);

  // Initial fetch for all providers
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
        // Refresh dynamic models list on success
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

  const defaultProvider = (config["DEFAULT_LLM_PROVIDER"] || "gemini").toLowerCase();
  const fallbackProvider = (config["FALLBACK_LLM_PROVIDER"] || "openai").toLowerCase();

  const geminiModels = providerModels["gemini"] || [];
  const openaiModels = providerModels["openai"] || [];
  const deepseekModels = providerModels["deepseek"] || [];
  const ollamaModels = providerModels["ollama"] || [];

  // Group Gemini models by category
  const geminiCategories = Array.from(new Set(geminiModels.map((m) => m.category)));

  // Helper to check if key is set
  const isKeyConfigured = (key?: string) => Boolean(key && key.trim() !== "");

  return (
    <div className="w-full space-y-6">
      {configLoading ? (
        <div className="text-center py-16 text-muted-foreground text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Memuat data konfigurasi provider AI...
        </div>
      ) : (
        <form onSubmit={onSaveConfig} className="space-y-6">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 2x2 BALANCED RESPONSIVE CARD GRID                                */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* ── CARD 1: GOOGLE GEMINI ────────────────────────────────────── */}
            <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
              <div>
                <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">
                          1. Google Gemini
                        </h3>
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

                  {/* Status Badge */}
                  <div>
                    {testStates["gemini"]?.success ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> {testStates["gemini"].latency_ms}ms
                      </Badge>
                    ) : testStates["gemini"]?.error ? (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                        <AlertCircle className="w-3 h-3" /> Error
                      </Badge>
                    ) : isKeyConfigured(config["GEMINI_API_KEY"]) ? (
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
                  {/* Gemini API Key */}
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
                        type={showGeminiKey ? "text" : "password"}
                        value={config["GEMINI_API_KEY"] || ""}
                        onChange={(e) => setConfig({ ...config, GEMINI_API_KEY: e.target.value })}
                        placeholder="AIzaSy... (atau biarkan jika sudah tersimpan)"
                        className="text-xs h-8 pr-8 font-mono bg-background border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Gemini Model Selector with Dynamic Optgroups */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="geminiModel" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <span>Model Generasi & Penalaran</span>
                        {detectedLiveMap["gemini"] && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-primary border-primary/30 bg-primary/10">
                            Live Detected
                          </Badge>
                        )}
                      </Label>
                      <button
                        type="button"
                        onClick={() => loadModelsForProvider("gemini", config["GEMINI_API_KEY"])}
                        disabled={loadingModels["gemini"]}
                        className="text-[11px] text-primary/80 hover:text-primary flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Scan model terbaru dari Google AI Studio"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingModels["gemini"] ? "animate-spin" : ""}`} />
                        <span>Scan Model ({geminiModels.length})</span>
                      </button>
                    </div>

                    <select
                      id="geminiModel"
                      value={config["GEMINI_CHAT_MODEL"] || "gemini-2.5-flash"}
                      onChange={(e) => setConfig({ ...config, GEMINI_CHAT_MODEL: e.target.value })}
                      className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      {geminiCategories.length > 0 ? (
                        geminiCategories.map((category) => (
                          <optgroup key={category} label={`── ${category} ──`} className="bg-card text-foreground font-sans font-semibold">
                            {geminiModels
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

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("gemini")}
                  disabled={testStates["gemini"]?.loading || (!config["GEMINI_API_KEY"] && !isKeyConfigured(config["GEMINI_API_KEY"]))}
                  className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
                >
                  {testStates["gemini"]?.loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 text-blue-400" />
                  )}
                  <span>Tes Koneksi</span>
                </Button>

                <div className="flex items-center gap-1.5">
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
            </div>

            {/* ── CARD 2: OPENAI ──────────────────────────────────────────── */}
            <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
              <div>
                <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">
                          2. OpenAI (GPT-4o / o3-mini)
                        </h3>
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

                  {/* Status Badge */}
                  <div>
                    {testStates["openai"]?.success ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> {testStates["openai"].latency_ms}ms
                      </Badge>
                    ) : testStates["openai"]?.error ? (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                        <AlertCircle className="w-3 h-3" /> Error
                      </Badge>
                    ) : isKeyConfigured(config["OPENAI_API_KEY"]) ? (
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
                        type={showOpenaiKey ? "text" : "password"}
                        value={config["OPENAI_API_KEY"] || ""}
                        onChange={(e) => setConfig({ ...config, OPENAI_API_KEY: e.target.value })}
                        placeholder="sk-proj-..."
                        className="text-xs h-8 pr-8 font-mono bg-background border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showOpenaiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                      {openaiModels.length > 0 ? (
                        openaiModels.map((m) => (
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

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("openai")}
                  disabled={testStates["openai"]?.loading || !config["OPENAI_API_KEY"]}
                  className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
                >
                  {testStates["openai"]?.loading ? (
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

            {/* ── CARD 3: DEEPSEEK / CUSTOM API ──────────────────────────── */}
            <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
              <div>
                <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">
                          3. DeepSeek / Custom API
                        </h3>
                        {defaultProvider === "deepseek" && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono px-1.5 py-0">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        OpenAI-Compatible Custom Endpoint (Groq / OpenRouter)
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {testStates["deepseek"]?.success ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> {testStates["deepseek"].latency_ms}ms
                      </Badge>
                    ) : testStates["deepseek"]?.error ? (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                        <AlertCircle className="w-3 h-3" /> Error
                      </Badge>
                    ) : isKeyConfigured(config["DEEPSEEK_API_KEY"]) ? (
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
                    <Label htmlFor="deepseekBase" className="text-xs font-medium text-foreground">
                      Base URL Endpoint
                    </Label>
                    <Input
                      id="deepseekBase"
                      type="text"
                      value={config["DEEPSEEK_BASE_URL"] || "https://api.deepseek.com/v1"}
                      onChange={(e) => setConfig({ ...config, DEEPSEEK_BASE_URL: e.target.value })}
                      placeholder="https://api.deepseek.com/v1"
                      className="text-xs h-8 font-mono bg-background border-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="deepseekKey" className="text-xs font-medium text-foreground">
                        API Key
                      </Label>
                      <div className="relative">
                        <Input
                          id="deepseekKey"
                          type={showDeepseekKey ? "text" : "password"}
                          value={config["DEEPSEEK_API_KEY"] || ""}
                          onChange={(e) => setConfig({ ...config, DEEPSEEK_API_KEY: e.target.value })}
                          placeholder="sk-..."
                          className="text-xs h-8 pr-8 font-mono bg-background border-border"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showDeepseekKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="deepseekModel" className="text-xs font-medium text-foreground">
                        Model Name
                      </Label>
                      <select
                        id="deepseekModel"
                        value={config["DEEPSEEK_CHAT_MODEL"] || "deepseek-chat"}
                        onChange={(e) => setConfig({ ...config, DEEPSEEK_CHAT_MODEL: e.target.value })}
                        className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden"
                      >
                        <option value="deepseek-chat">deepseek-chat (DeepSeek-V3)</option>
                        <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("deepseek")}
                  disabled={testStates["deepseek"]?.loading || !config["DEEPSEEK_API_KEY"]}
                  className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
                >
                  {testStates["deepseek"]?.loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 text-cyan-400" />
                  )}
                  <span>Tes Koneksi</span>
                </Button>

                <Button
                  type="button"
                  variant={defaultProvider === "deepseek" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "deepseek" })}
                  className="text-xs h-7 cursor-pointer"
                >
                  {defaultProvider === "deepseek" ? "✓ Utama" : "Set Utama"}
                </Button>
              </div>
            </div>

            {/* ── CARD 4: LOCAL OLLAMA ENGINE ─────────────────────────────── */}
            <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
              <div>
                <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground">
                          4. Local Ollama Engine
                        </h3>
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

                  {/* Status Badge */}
                  <div>
                    {testStates["ollama"]?.success ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Online ({testStates["ollama"].latency_ms}ms)
                      </Badge>
                    ) : testStates["ollama"]?.error ? (
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
                        onClick={() => loadModelsForProvider("ollama", undefined, config["OLLAMA_BASE_URL"])}
                        disabled={loadingModels["ollama"]}
                        className="text-[11px] text-primary/80 hover:text-primary flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingModels["ollama"] ? "animate-spin" : ""}`} />
                        <span>Scan Ollama Models ({ollamaModels.length})</span>
                      </button>
                    </div>

                    <select
                      id="ollamaModel"
                      value={config["OLLAMA_CHAT_MODEL"] || "llama3.2"}
                      onChange={(e) => setConfig({ ...config, OLLAMA_CHAT_MODEL: e.target.value })}
                      className="w-full text-xs h-8 px-2.5 rounded-lg bg-background border border-border text-foreground font-mono cursor-pointer outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      {ollamaModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("ollama")}
                  disabled={testStates["ollama"]?.loading}
                  className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
                >
                  {testStates["ollama"]?.loading ? (
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

          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* GLOBAL RAG PARAMETERS & AUTO-FALLBACK                            */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Parameter Pencarian Semantik & Auto-Fallback
              </h3>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="maxChunks" className="text-xs font-medium text-foreground">
                  Max RAG Chunks
                </Label>
                <Input
                  id="maxChunks"
                  type="number"
                  min={1}
                  max={20}
                  value={config["RAG_CHUNK_SIZE"] || config["rag_max_chunks"] || "5"}
                  onChange={(e) => setConfig({ ...config, RAG_CHUNK_SIZE: e.target.value, rag_max_chunks: e.target.value })}
                  className="text-xs h-8 font-mono bg-background border-border"
                />
                <p className="text-[10px] text-muted-foreground">Jumlah potongan dokumen yang disuntikkan ke prompt.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minSim" className="text-xs font-medium text-foreground">
                  Min Similarity Threshold
                </Label>
                <Input
                  id="minSim"
                  type="number"
                  step="0.05"
                  min={0.1}
                  max={0.9}
                  value={config["RAG_CHUNK_OVERLAP"] || config["rag_min_similarity"] || "0.25"}
                  onChange={(e) => setConfig({ ...config, RAG_CHUNK_OVERLAP: e.target.value, rag_min_similarity: e.target.value })}
                  className="text-xs h-8 font-mono bg-background border-border"
                />
                <p className="text-[10px] text-muted-foreground">Ambang batas skor kemiripan kosinus (0.1 - 0.9).</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Auto-Fallback Status
                </Label>
                <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-background border border-border">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">Aktif Otomatis</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Beralih ke OpenAI jika kuota Gemini habis.</p>
              </div>
            </div>
          </div>

          {/* ── Save Bottom Actions Bar ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Perubahan konfigurasi provider tersimpan di file konfigurasi server dan aktif secara instan.</span>
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
