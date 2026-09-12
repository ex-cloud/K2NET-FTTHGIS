import React, { useState } from "react";
import { Flame, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { Button, Input, Label, Badge } from "@k2net/ui";
import type { ProviderTestState } from "./useAiConfigProviders";

interface ProviderDeepSeekCardProps {
  config: Record<string, string>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  testState?: ProviderTestState;
  defaultProvider: string;
  onTest: () => void;
}

export function ProviderDeepSeekCard({
  config,
  setConfig,
  testState,
  defaultProvider,
  onTest,
}: ProviderDeepSeekCardProps) {
  const [showKey, setShowKey] = useState(false);
  const isKeyConfigured = Boolean(config["DEEPSEEK_API_KEY"] && config["DEEPSEEK_API_KEY"].trim() !== "");

  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between overflow-hidden">
      <div>
        <div className="border-b border-border/70 bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">3. DeepSeek / Custom API</h3>
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
                  type={showKey ? "text" : "password"}
                  value={config["DEEPSEEK_API_KEY"] || ""}
                  onChange={(e) => setConfig({ ...config, DEEPSEEK_API_KEY: e.target.value })}
                  placeholder="sk-..."
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

      <div className="px-5 py-3 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testState?.loading || !config["DEEPSEEK_API_KEY"]}
          className="text-xs h-7 gap-1.5 cursor-pointer font-medium"
        >
          {testState?.loading ? (
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
  );
}
