import { useRouter } from "@/lib/navigation-compat";
import { Network, ArrowLeft, Plus, FlaskConical } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { AiKnowledgeGraphTab } from "@/components/ai/ai-knowledge-graph-tab";

export default function AiGraphPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-xs">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  {t("ai.knowledge_graph_title")}
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-purple-500/30 text-purple-400 bg-purple-500/10">
                  {t("ai.fps_force_directed")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("ai.knowledge_graph_subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label={t("ai.back_to_docs_tooltip")} shortcut="Esc">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("ai.back_to_table")}
              </Button>
            </ActionTooltip>
            <ActionTooltip label={t("ai.open_rag_simulator_tooltip")} shortcut="S then S">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai/simulator")}
                className="text-xs gap-1.5 border-border/80 text-foreground hover:bg-muted/50 cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {t("ai.open_rag_simulator")}
              </Button>
            </ActionTooltip>
            <ActionTooltip label={t("ai.write_new_sop_tooltip")} shortcut="N">
              <Button
                size="sm"
                onClick={() => router.push("/ai/add")}
                className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("ai.write_new_sop")}
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* 2D Obsidian Graph Component */}
        <AiKnowledgeGraphTab
          onTestSimulator={(title) => {
            router.push(`/ai/simulator?query=${encodeURIComponent(title)}`);
          }}
          onOpenExplorer={() => {
            router.push("/ai");
          }}
        />

      </div>
    </AiPageWrapper>
  );
}
