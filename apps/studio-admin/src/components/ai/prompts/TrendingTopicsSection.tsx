import React from "react";
import { TrendingUp, Flame, Activity, CheckCircle2, ArrowUpRight, Loader2 } from "lucide-react";
import { Badge } from "@k2net/ui";
import type { TrendingTopicItem } from "@/lib/actions/gateways";

interface TrendingTopicsSectionProps {
  trending: TrendingTopicItem[];
  trendingLoading: boolean;
  onConvertTrendingToPrompt: (topic: TrendingTopicItem) => void;
}

export function TrendingTopicsSection({
  trending,
  trendingLoading,
  onConvertTrendingToPrompt,
}: TrendingTopicsSectionProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Trending Pertanyaan Pengguna (7 Hari Terakhir)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Pertanyaan yang paling sering diajukan oleh teknisi dan operator di Ask AI.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-rose-500/30 text-rose-500 bg-rose-500/10 gap-1"
        >
          <Flame className="w-3 h-3" /> Live Telemetry
        </Badge>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {trendingLoading ? (
          <div className="col-span-3 py-6 text-center text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
            Menganalisis frekuensi query pengguna...
          </div>
        ) : trending.length === 0 ? (
          <div className="col-span-3 py-8 text-center space-y-1.5">
            <Activity className="w-6 h-6 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-semibold text-foreground">
              Belum ada log pertanyaan pengguna tercatat minggu ini
            </p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Topik trending akan otomatis terbentuk dan diagregasikan secara real-time dari riwayat
              percakapan teknisi di Ask AI Copilot.
            </p>
          </div>
        ) : (
          trending.map((topic, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors flex flex-col justify-between space-y-2 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-1 py-0 border-border text-muted-foreground"
                  >
                    #{i + 1}
                  </Badge>
                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 font-mono">
                    <Flame className="w-2.5 h-2.5" /> {topic.count}x ditanyakan
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-foreground line-clamp-1">{topic.topic}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 italic">
                  &ldquo;{topic.sample_query}&rdquo;
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 border-border text-foreground/75 dark:text-muted-foreground"
                >
                  {topic.category}
                </Badge>

                {topic.is_already_prompt ? (
                  <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Sudah Ada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConvertTrendingToPrompt(topic)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>+ Jadi Quick Prompt</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
