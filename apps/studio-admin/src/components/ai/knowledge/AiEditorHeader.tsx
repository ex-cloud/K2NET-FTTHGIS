import React from "react";
import { Sparkles, Wand2, StopCircle, BrainCircuit } from "lucide-react";
import { Label } from "@k2net/ui";
import type { KnowledgeScope } from "../types";

interface AiEditorHeaderProps {
  manualTitle: string;
  manualCategory: string;
  manualScope: KnowledgeScope;
  aiGenerating: boolean;
  aiGeneratedChars: number;
  canGenerateAi: boolean;
  onGenerateWithAi: () => void;
  onStopGeneration: () => void;
  onGoToTemplates: () => void;
}

export function AiEditorHeader({
  manualTitle,
  manualCategory,
  manualScope,
  aiGenerating,
  aiGeneratedChars,
  canGenerateAi,
  onGenerateWithAi,
  onStopGeneration,
  onGoToTemplates,
}: AiEditorHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor="manualDocContent"
          className="text-xs font-medium text-foreground flex items-center gap-1.5"
        >
          <span>Konten SOP / Manual (Format Markdown)</span>
          <span className="text-destructive">*</span>
        </Label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onGoToTemplates}
            className="text-[11px] text-primary/80 hover:text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Gunakan Template SOP
          </button>

          <span className="text-border text-[11px]">|</span>

          {aiGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <StopCircle className="w-3 h-3 animate-pulse" />
              Hentikan ({aiGeneratedChars} karakter)
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerateWithAi}
              disabled={!canGenerateAi}
              title={
                !manualTitle.trim() || manualTitle.trim().length < 5
                  ? "Isi judul minimal 5 karakter terlebih dahulu"
                  : "Generate draft SOP dengan AI berdasarkan judul, kategori & visibilitas"
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-3 h-3" />
              Generate dengan AI
            </button>
          )}
        </div>
      </div>

      {aiGenerating && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-primary">
          <BrainCircuit className="w-3.5 h-3.5 animate-pulse shrink-0" />
          <span>
            AI sedang menyusun draft SOP berdasarkan:{" "}
            <span className="font-semibold">{manualTitle}</span>
            {" · "}
            <span className="opacity-75">
              {manualCategory} · {manualScope}
            </span>
          </span>
          <span className="ml-auto font-mono text-primary/60">{aiGeneratedChars} kar</span>
        </div>
      )}
    </>
  );
}
