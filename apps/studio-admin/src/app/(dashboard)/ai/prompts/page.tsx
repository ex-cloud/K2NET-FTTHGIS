import { useRouter } from "@/lib/navigation-compat";
import { Sparkles, Database, Bot } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { AiPromptsTab } from "@/components/ai/ai-prompts-tab";

export default function AiPromptsPage() {
  const router = useRouter();
  const { t } = useTranslation();

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
                  {t("ai.prompts_title")}
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
                  {t("ai.interactive_ideas")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("ai.prompts_subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label={t("ai.back_to_knowledge_base_tooltip")}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                {t("ai.back_to_knowledge_base")}
              </Button>
            </ActionTooltip>

            <ActionTooltip label={t("ai.ai_config_tooltip")}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai/config")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                {t("ai.ai_config_btn")}
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
