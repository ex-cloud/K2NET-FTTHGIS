import { useRouter } from "@/lib/navigation-compat";
import { FileCode, Plus, Database } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { AiTemplatesTab } from "@/components/ai/ai-templates-tab";
import { type KnowledgeTemplateItem } from "@/components/ai/types";

export default function AiTemplatesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleUseTemplate = (template: KnowledgeTemplateItem) => {
    router.push(`/ai/add?template=${encodeURIComponent(template.title)}`);
  };

  return (
    <AiPageWrapper>
      <div className="flex-1 w-full bg-background overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  {t("ai.templates_title")}
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-amber-500/30 text-amber-400 bg-amber-500/10">
                  {t("ai.hardware_standards")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("ai.templates_subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label={t("ai.back_to_ai_docs")}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                {t("ai.doc_list")}
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

        {/* Templates Component */}
        <AiTemplatesTab onUseTemplate={handleUseTemplate} />

      </div>
    </AiPageWrapper>
  );
}
