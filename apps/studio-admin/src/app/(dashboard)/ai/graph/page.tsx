

import { useRouter } from "@/lib/navigation-compat";
import { Network, ArrowLeft, Plus, FlaskConical } from "lucide-react";
import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { AiPageWrapper } from "@/components/page-guards/ai-page-wrapper";
import { AiKnowledgeGraphTab } from "@/components/ai/ai-knowledge-graph-tab";

export default function AiGraphPage() {
  const router = useRouter();

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
                  Graf Pengetahuan 2D (Obsidian Graph)
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 border-purple-500/30 text-purple-400 bg-purple-500/10">
                  60 FPS Force-Directed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visualisasi topologi semantik koneksi antar dokumen SOP dengan simulasi hukum gravitasi Coulomb & pegas Hooke.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionTooltip label="Kembali ke Daftar Dokumen SOP">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai")}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Tabel
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Buka Pengujian Semantic RAG Simulator" shortcut="S">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ai/simulator")}
                className="text-xs gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Buka RAG Simulator
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
