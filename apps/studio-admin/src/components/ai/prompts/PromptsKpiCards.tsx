import React from "react";
import { Sparkles, Pin, Activity, Flame } from "lucide-react";

interface PromptsKpiCardsProps {
  totalPrompts: number;
  activeCount: number;
  pinnedCount: number;
  totalQueriesAnalyzed: number;
  trendingCount: number;
}

export function PromptsKpiCards({
  totalPrompts,
  activeCount,
  pinnedCount,
  totalQueriesAnalyzed,
  trendingCount,
}: PromptsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Prompts */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">
            Total Kartu Rekomendasi
          </p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{totalPrompts}</h3>
          <p className="text-[10px] text-primary mt-0.5">{activeCount} Prompt Aktif di Drawer</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* Pinned Prompts */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">
            Prompt Di-Pin (Prioritas)
          </p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{pinnedCount}</h3>
          <p className="text-[10px] text-amber-500 mt-0.5">Tampil paling atas di Ask AI</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
          <Pin className="w-5 h-5" />
        </div>
      </div>

      {/* Total Analytics Queries */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">
            Analisis Query Pengguna
          </p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{totalQueriesAnalyzed}</h3>
          <p className="text-[10px] text-primary mt-0.5">Log pertanyaan 7 hari terakhir</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* Trending Topics Detected */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-foreground/75 dark:text-muted-foreground">
            Topik Populer Terdeteksi
          </p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{trendingCount}</h3>
          <p className="text-[10px] text-rose-500 mt-0.5">Trending di lapangan</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
          <Flame className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
