"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  Button, 
  Input, 
  Label 
} from "@k2net/ui";

interface AiConfigTabProps {
  config: Record<string, string>;
  setConfig: (c: Record<string, string>) => void;
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
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  return (
    <Card className="border-border bg-card max-w-2xl mx-auto shadow-xs">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Konfigurasi AI Engine & Provider LLM
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Kelola API Keys dan engine default untuk AI Assistant Gateway.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {configLoading ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            Memuat konfigurasi AI Gateway...
          </div>
        ) : (
          <form onSubmit={onSaveConfig} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="provider" className="text-xs">Default LLM Provider</Label>
              <select
                id="provider"
                value={config["DEFAULT_LLM_PROVIDER"] || "gemini"}
                onChange={(e) => setConfig({ ...config, DEFAULT_LLM_PROVIDER: e.target.value })}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="gemini">Google Gemini (Gemini 2.5 Flash / Pro)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="ollama">Local Ollama Engine (DeepSeek-R1 / Llama 3 on-premise)</option>
              </select>
            </div>

            {config["DEFAULT_LLM_PROVIDER"] === "ollama" && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ollamaUrl" className="text-xs">Ollama Base URL</Label>
                  <Input
                    id="ollamaUrl"
                    type="text"
                    value={config["OLLAMA_BASE_URL"] || "http://host.docker.internal:11434/v1"}
                    onChange={(e) => setConfig({ ...config, OLLAMA_BASE_URL: e.target.value })}
                    placeholder="http://host.docker.internal:11434/v1"
                    className="text-xs h-9 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Endpoint OpenAI-compatible lokal (Ollama / vLLM / LM Studio). 100% private, tanpa API key.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ollamaModel" className="text-xs">Ollama Model Name</Label>
                  <Input
                    id="ollamaModel"
                    type="text"
                    value={config["OLLAMA_CHAT_MODEL"] || "llama3.2"}
                    onChange={(e) => setConfig({ ...config, OLLAMA_CHAT_MODEL: e.target.value })}
                    placeholder="llama3.2 / deepseek-r1:7b / qwen2.5"
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="geminiKey" className="text-xs">Google Gemini API Key</Label>
              <div className="relative">
                <Input
                  id="geminiKey"
                  type={showGeminiKey ? "text" : "password"}
                  value={config["GEMINI_API_KEY"] || ""}
                  onChange={(e) => setConfig({ ...config, GEMINI_API_KEY: e.target.value })}
                  placeholder="AIzaSy..."
                  className="text-xs h-9 pr-9 font-mono"
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
              <Label htmlFor="openaiKey" className="text-xs">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="openaiKey"
                  type={showOpenaiKey ? "text" : "password"}
                  value={config["OPENAI_API_KEY"] || ""}
                  onChange={(e) => setConfig({ ...config, OPENAI_API_KEY: e.target.value })}
                  placeholder="sk-proj-..."
                  className="text-xs h-9 pr-9 font-mono"
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

            <div className="pt-2 flex justify-end gap-2">
              <Button type="submit" size="sm" disabled={configSaving} className="gap-1.5">
                {configSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Save className="w-3.5 h-3.5" />
                {configSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
