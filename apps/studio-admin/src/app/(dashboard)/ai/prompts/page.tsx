

import { useRouter } from "@/lib/navigation-compat";
import { Sparkles, Database, Plus, Bot } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { AiPromptsTab } from "@/components/ai/ai-prompts-tab";

export default function AiPromptsPage() {
  const router = useRouter();

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Saran Prompt & Analitik Trending
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                  Interactive Ideas
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kelola kartu ide pertanyaan cepat (Quick Actions) dan pantau topik trending yang sering ditanyakan pengguna di Ask AI Copilot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Kembali ke Basis Pengetahuan AI">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                Basis Pengetahuan
              </Button>
            </ActionTooltip>

            <ActionTooltip label="Buka Multi-Provider Hub">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai/config")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                Konfigurasi AI
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Suggested Prompts & Trending Component */}
        <AiPromptsTab />

      </div>
    </AiPageWrapper>
  );
}
