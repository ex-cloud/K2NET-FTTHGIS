"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Database, RefreshCw } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { toast } from "sonner";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { getGatewayConfigByKey, updateGatewayConfigByKey } from "@/lib/actions/gateways";
import { AiConfigTab } from "../../gateways/ai/components/ai-config-tab";

export default function AiConfigPage() {
  const router = useRouter();

  // Engine Configuration State
  const [config, setConfig] = useState<Record<string, string>>({
    default_llm_provider: "GEMINI",
    gemini_model: "gemini-2.5-flash",
    openai_model: "gpt-4o-mini",
    ollama_base_url: "http://host.docker.internal:11434",
    ollama_model: "deepseek-r1:7b",
    rag_max_chunks: "5",
    rag_min_similarity: "0.25",
    enable_auto_fallback: "true",
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const res = await getGatewayConfigByKey("ai");
      const flatConfig: Record<string, string> = {};
      if (res && res.sections) {
        Object.values(res.sections).forEach((entries) => {
          entries.forEach((entry) => {
            flatConfig[entry.key] = entry.value || "";
          });
        });
      }
      if (Object.keys(flatConfig).length > 0) {
        setConfig((prev) => ({ ...prev, ...flatConfig }));
      }
    } catch (err) {
      console.error("Gagal memuat konfigurasi AI:", err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConfigSaving(true);
      await updateGatewayConfigByKey("ai", config);
      toast.success("Konfigurasi AI Engine & Multi-Provider berhasil disimpan");
    } catch (err) {
      console.error("Gagal menyimpan konfigurasi AI:", err);
      toast.error("Gagal menyimpan konfigurasi gateway");
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Multi-Provider Hub & AI Config
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                  Model Router
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Konfigurasi provider model bahasa (Google Gemini, OpenAI, DeepSeek Custom, Local Ollama) dengan validasi API token live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Daftar Pengetahuan" shortcut="Esc">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                Daftar Pengetahuan
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Reload Konfigurasi" shortcut="R">
              <Button
                variant="outline"
                size="sm"
                onClick={loadConfig}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Config
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Multi-Provider Hub Component with Live Token Test */}
        <AiConfigTab
          config={config}
          setConfig={setConfig}
          configLoading={configLoading}
          configSaving={configSaving}
          onSaveConfig={handleSaveConfig}
        />

      </div>
    </AiPageWrapper>
  );
}
