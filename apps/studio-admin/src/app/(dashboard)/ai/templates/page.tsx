

import { useRouter } from "@/lib/navigation-compat";
import { FileCode, ArrowLeft, Plus, Database } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { AiTemplatesTab } from "@/components/ai/ai-templates-tab";
import { KnowledgeTemplateItem } from "@/components/ai/types";

export default function AiTemplatesPage() {
  const router = useRouter();

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
                  Contoh & Template SOP
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-amber-500/30 text-amber-400 bg-amber-500/10">
                  Hardware Standards
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Koleksi contoh format penulisan standar operasional prosedur untuk hardware OLT ZTE, Huawei, MikroTik, dan survey GIS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Kembali ke Daftar Dokumen AI">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                Daftar Dokumen
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Tulis Dokumen SOP Baru" shortcut="N">
              <Button
                size="sm"
                onClick={() => router.push("/ai/add")}
                className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tulis SOP Baru
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
