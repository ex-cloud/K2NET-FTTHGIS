import React from "react";
import { Sliders } from "lucide-react";
import { Input, Label } from "@k2net/ui";

interface SystemAiParamsCardProps {
  config: Record<string, string>;
  setConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function SystemAiParamsCard({ config, setConfig }: SystemAiParamsCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border/70 bg-muted/20 flex items-center gap-2">
        <Sliders className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          Parameter Pencarian Semantik & Auto-Fallback
        </h3>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="maxChunks" className="text-xs font-medium text-foreground">
            Max RAG Chunks
          </Label>
          <Input
            id="maxChunks"
            type="number"
            min={1}
            max={20}
            value={config["RAG_CHUNK_SIZE"] || config["rag_max_chunks"] || "5"}
            onChange={(e) =>
              setConfig({
                ...config,
                RAG_CHUNK_SIZE: e.target.value,
                rag_max_chunks: e.target.value,
              })
            }
            className="text-xs h-8 font-mono bg-background border-border"
          />
          <p className="text-[10px] text-muted-foreground">
            Jumlah potongan dokumen yang disuntikkan ke prompt.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="minSim" className="text-xs font-medium text-foreground">
            Min Similarity Threshold
          </Label>
          <Input
            id="minSim"
            type="number"
            step="0.05"
            min={0.1}
            max={0.9}
            value={config["RAG_CHUNK_OVERLAP"] || config["rag_min_similarity"] || "0.25"}
            onChange={(e) =>
              setConfig({
                ...config,
                RAG_CHUNK_OVERLAP: e.target.value,
                rag_min_similarity: e.target.value,
              })
            }
            className="text-xs h-8 font-mono bg-background border-border"
          />
          <p className="text-[10px] text-muted-foreground">
            Ambang batas skor kemiripan kosinus (0.1 - 0.9).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">
            Auto-Fallback Status
          </Label>
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-background border border-border">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-foreground">Aktif Otomatis</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Beralih ke OpenAI jika kuota Gemini habis.
          </p>
        </div>
      </div>
    </div>
  );
}
