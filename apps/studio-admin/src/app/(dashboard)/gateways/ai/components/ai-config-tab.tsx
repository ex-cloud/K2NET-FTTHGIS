"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Server, 
  Sparkles, 
  Zap, 
  Check, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  Button, 
  Input, 
  Label,
  Badge 
} from "@k2net/ui";
import { toast } from "sonner";
import { testAiProviderConnection } from "@/lib/actions/gateways";

interface AiConfigTabProps {
  config: Record<string, string>;
  setConfig: (c: Record<string, string>) => void;
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
        model = config["GEMINI_CHAT_MODEL"] || "models/gemini-2.5-flash";
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

  const defaultProvider = config["DEFAULT_LLM_PROVIDER"] || "gemini";
  const fallbackProvider = config["FALLBACK_LLM_PROVIDER"] || "openai";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Top Header Banner ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              AI Engine & Multi-Provider Hub
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono">
                Multi-LLM Active
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola Google Gemini, OpenAI, DeepSeek, dan Local Ollama secara dinamis dengan fitur pengujian token & auto-fallback.
            </p>
          </div>
        </div>

        {/* Global Primary & Fallback Selector Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl text-xs">
            <span className="text-muted-foreground">Utama (Primary):</span>
            <span className="font-bold text-primary capitalize font-mono">{defaultProvider}</span>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl text-xs">
            <span className="text-muted-foreground">Cadangan (Fallback):</span>
            <span className="font-bold text-amber-400 capitalize font-mono">{fallbackProvider}</span>
          </div>
        </div>
      </div>

      {configLoading ? (
        <div className="text-center py-16 text-muted-foreground text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Memuat data konfigurasi provider AI...
        </div>
      ) : (
        <form onSubmit={onSaveConfig} className="space-y-6">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 1. GOOGLE GEMINI (RECOMMENDED CLOUD AI)                          */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <Card glowingEffect className="border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="border-b border-border/80 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">
                      1. Google Gemini (Cloud Reasoning Brain)
                    </CardTitle>
                    {defaultProvider === "gemini" && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono">
                        Active Primary
                      </Badge>
                    )}
                    {fallbackProvider === "gemini" && defaultProvider !== "gemini" && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] font-mono">
                        Auto-Fallback
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Model default rekomendasi FTTH GIS. Dilengkapi kuota gratis 1.500 request/hari tanpa batas kedaluwarsa.
                  </CardDescription>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                {testStates["gemini"]?.success ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Connected ({testStates["gemini"].latency_ms}ms)
                  </Badge>
                ) : testStates["gemini"]?.error ? (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> Error
                  </Badge>
                ) : config["GEMINI_API_KEY"] ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                    Not Configured
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="geminiKey" className="text-xs font-medium text-foreground">
                    Google Gemini API Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="geminiKey"
                      type={showGeminiKey ? "text" : "password"}
                      value={config["GEMINI_API_KEY"] || ""}
                      onChange={(e) => setConfig({ ...config, GEMINI_API_KEY: e.target.value })}
                      placeholder="AIzaSy..."
                      className="text-xs h-9 pr-9 font-mono bg-background border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="geminiModel" className="text-xs font-medium text-foreground">
                    Model Generasi
                  </Label>
                  <select
                    id="geminiModel"
                    value={config["GEMINI_CHAT_MODEL"] || "models/gemini-2.5-flash"}
                    onChange={(e) => setConfig({ ...config, GEMINI_CHAT_MODEL: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    <option value="models/gemini-2.5-flash">models/gemini-2.5-flash (Ultra Cepat & Akurat)</option>
                    <option value="models/gemini-1.5-flash">models/gemini-1.5-flash (Stabil & Ringan)</option>
                    <option value="models/gemini-1.5-pro">models/gemini-1.5-pro (Reasoning Kompleks)</option>
                  </select>
                </div>
              </div>

              {testStates["gemini"]?.error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                  {testStates["gemini"].error}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Dapatkan API Key Gratis di Google AI Studio</span>
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestProvider("gemini")}
                    disabled={testStates["gemini"]?.loading}
                    className="text-xs gap-1.5 cursor-pointer font-medium"
                  >
                    {testStates["gemini"]?.loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>Tes Koneksi Token</span>
                  </Button>
                  <Button
                    type="button"
                    variant={defaultProvider === "gemini" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "gemini" })}
                    className="text-xs cursor-pointer"
                  >
                    {defaultProvider === "gemini" ? "✓ Default Utama" : "Set Jadi Utama"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 2. OPENAI (GPT-4o / GPT-4o-MINI)                                 */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <Card glowingEffect className="border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="border-b border-border/80 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">
                      2. OpenAI (GPT-4o / GPT-4o-mini)
                    </CardTitle>
                    {defaultProvider === "openai" && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono">
                        Active Primary
                      </Badge>
                    )}
                    {fallbackProvider === "openai" && defaultProvider !== "openai" && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] font-mono">
                        Auto-Fallback
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Sangat cocok sebagai cadangan (*auto-fallback*) atau mesin embedding standar OpenAI.
                  </CardDescription>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                {testStates["openai"]?.success ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Connected ({testStates["openai"].latency_ms}ms)
                  </Badge>
                ) : testStates["openai"]?.error ? (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> Error
                  </Badge>
                ) : config["OPENAI_API_KEY"] ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                    Not Configured
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="text-xs h-9 pr-9 font-mono bg-background border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="openaiModel" className="text-xs font-medium text-foreground">
                    Model
                  </Label>
                  <select
                    id="openaiModel"
                    value={config["OPENAI_CHAT_MODEL"] || "gpt-4o-mini"}
                    onChange={(e) => setConfig({ ...config, OPENAI_CHAT_MODEL: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Cepat & Hemat Biaya)</option>
                    <option value="gpt-4o">gpt-4o (Flagship Multimodal)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                  </select>
                </div>
              </div>

              {testStates["openai"]?.error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                  {testStates["openai"].error}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Kelola API Keys di OpenAI Platform</span>
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestProvider("openai")}
                    disabled={testStates["openai"]?.loading}
                    className="text-xs gap-1.5 cursor-pointer font-medium"
                  >
                    {testStates["openai"]?.loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Tes Koneksi Token</span>
                  </Button>
                  <Button
                    type="button"
                    variant={defaultProvider === "openai" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "openai" })}
                    className="text-xs cursor-pointer"
                  >
                    {defaultProvider === "openai" ? "✓ Default Utama" : "Set Jadi Utama"}
                  </Button>
                  <Button
                    type="button"
                    variant={fallbackProvider === "openai" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setConfig({ ...config, FALLBACK_LLM_PROVIDER: "openai" })}
                    className="text-xs cursor-pointer"
                  >
                    {fallbackProvider === "openai" ? "✓ Auto-Fallback" : "Set Fallback"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 3. DEEPSEEK CLOUD / GROQ / CUSTOM OPENAI-COMPATIBLE              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <Card glowingEffect className="border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="border-b border-border/80 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">
                      3. DeepSeek Cloud / Groq / OpenRouter (Custom OpenAI-Compatible)
                    </CardTitle>
                    {defaultProvider === "deepseek" && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono">
                        Active Primary
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Hubungkan ke penyedia LLM cloud apa pun dengan protokol standar OpenAI (DeepSeek, Groq, OpenRouter, Together AI).
                  </CardDescription>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                {testStates["deepseek"]?.success ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Connected ({testStates["deepseek"].latency_ms}ms)
                  </Badge>
                ) : testStates["deepseek"]?.error ? (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> Error
                  </Badge>
                ) : config["DEEPSEEK_API_KEY"] ? (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] font-mono">
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                    Optional
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="deepseekUrl" className="text-xs font-medium text-foreground">
                    Base URL Endpoint
                  </Label>
                  <Input
                    id="deepseekUrl"
                    type="text"
                    value={config["DEEPSEEK_BASE_URL"] || "https://api.deepseek.com/v1"}
                    onChange={(e) => setConfig({ ...config, DEEPSEEK_BASE_URL: e.target.value })}
                    placeholder="https://api.deepseek.com/v1"
                    className="text-xs h-9 font-mono bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deepseekKey" className="text-xs font-medium text-foreground">
                    API Key Token
                  </Label>
                  <div className="relative">
                    <Input
                      id="deepseekKey"
                      type={showDeepseekKey ? "text" : "password"}
                      value={config["DEEPSEEK_API_KEY"] || ""}
                      onChange={(e) => setConfig({ ...config, DEEPSEEK_API_KEY: e.target.value })}
                      placeholder="sk-..."
                      className="text-xs h-9 pr-9 font-mono bg-background border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deepseekModel" className="text-xs font-medium text-foreground">
                    Model Name
                  </Label>
                  <Input
                    id="deepseekModel"
                    type="text"
                    value={config["DEEPSEEK_CHAT_MODEL"] || "deepseek-chat"}
                    onChange={(e) => setConfig({ ...config, DEEPSEEK_CHAT_MODEL: e.target.value })}
                    placeholder="deepseek-chat / deepseek-reasoner / llama-3.3-70b-versatile"
                    className="text-xs h-9 font-mono bg-background border-border"
                  />
                </div>
              </div>

              {testStates["deepseek"]?.error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                  {testStates["deepseek"].error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("deepseek")}
                  disabled={testStates["deepseek"]?.loading}
                  className="text-xs gap-1.5 cursor-pointer font-medium"
                >
                  {testStates["deepseek"]?.loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>Tes Koneksi Token</span>
                </Button>
                <Button
                  type="button"
                  variant={defaultProvider === "deepseek" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "deepseek" })}
                  className="text-xs cursor-pointer"
                >
                  {defaultProvider === "deepseek" ? "✓ Default Utama" : "Set Jadi Utama"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 4. LOCAL OLLAMA / ON-PREMISE PRIVATE AI                           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <Card glowingEffect className="border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="border-b border-border/80 bg-muted/10 p-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">
                      4. Local Ollama Engine (On-Premise Private AI)
                    </CardTitle>
                    {defaultProvider === "ollama" && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono">
                        Active Primary
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Menjalankan inferensi DeepSeek-R1 / Llama 3 langsung di server fisik tanpa API key cloud.
                  </CardDescription>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                {testStates["ollama"]?.success ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Online ({testStates["ollama"].latency_ms}ms)
                  </Badge>
                ) : testStates["ollama"]?.error ? (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> Offline / Belum Aktif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                    On-Premise
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="text-xs h-9 font-mono bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ollamaModel" className="text-xs font-medium text-foreground">
                    Model Name
                  </Label>
                  <Input
                    id="ollamaModel"
                    type="text"
                    value={config["OLLAMA_CHAT_MODEL"] || "llama3.2"}
                    onChange={(e) => setConfig({ ...config, OLLAMA_CHAT_MODEL: e.target.value })}
                    placeholder="llama3.2 / deepseek-r1:7b / qwen2.5"
                    className="text-xs h-9 font-mono bg-background border-border"
                  />
                </div>
              </div>

              {testStates["ollama"]?.error && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
                  <p className="font-semibold">⚠️ Ollama Daemon Belum Berjalan</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Jalankan perintah berikut di terminal server jika ingin menggunakan AI lokal on-premise:
                  </p>
                  <code className="block mt-1.5 p-2 rounded bg-background/80 font-mono text-[11px] text-foreground">
                    curl -fsSL https://ollama.com/install.sh | sh && ollama run {config["OLLAMA_CHAT_MODEL"] || "llama3.2"}
                  </code>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider("ollama")}
                  disabled={testStates["ollama"]?.loading}
                  className="text-xs gap-1.5 cursor-pointer font-medium"
                >
                  {testStates["ollama"]?.loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Tes Koneksi Daemon</span>
                </Button>
                <Button
                  type="button"
                  variant={defaultProvider === "ollama" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setConfig({ ...config, DEFAULT_LLM_PROVIDER: "ollama" })}
                  className="text-xs cursor-pointer"
                >
                  {defaultProvider === "ollama" ? "✓ Default Utama" : "Set Jadi Utama"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Save Bottom Actions Bar ───────────────────────────────────── */}
          <div className="flex items-center justify-between pt-4 border-t border-border bg-card/60 p-4 rounded-xl backdrop-blur-md">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Perubahan konfigurasi provider langsung aktif seketika tanpa perlu restart service.</span>
            </div>

            <Button
              type="submit"
              disabled={configSaving}
              className="text-xs gap-2 font-bold px-6 shadow-md cursor-pointer"
            >
              {configSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Konfigurasi...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Seluruh Konfigurasi Provider</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
