import React from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { Button, Input, Label } from "@k2net/ui";
import { CATEGORIES, KNOWLEDGE_SCOPES, type KnowledgeScope } from "../types";
import { AiRichEditor } from "../ai-rich-editor";
import { useAiSopGenerator } from "./useAiSopGenerator";
import { AiEditorHeader } from "./AiEditorHeader";

interface AiManualKnowledgeFormProps {
  manualTitle: string;
  setManualTitle: (t: string) => void;
  manualCategory: string;
  setManualCategory: (c: string) => void;
  manualScope?: KnowledgeScope;
  setManualScope?: (s: KnowledgeScope) => void;
  manualAutoApprove?: boolean;
  setManualAutoApprove?: (a: boolean) => void;
  manualContent: string;
  setManualContent: (c: string) => void;
  manualSubmitting: boolean;
  onManualSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onGoToTemplates: () => void;
}

export function AiManualKnowledgeForm({
  manualTitle,
  setManualTitle,
  manualCategory,
  setManualCategory,
  manualScope = "GLOBAL",
  setManualScope,
  manualAutoApprove = true,
  setManualAutoApprove,
  manualContent,
  setManualContent,
  manualSubmitting,
  onManualSubmit,
  onCancel,
  onGoToTemplates,
}: AiManualKnowledgeFormProps) {
  const {
    aiGenerating,
    aiGeneratedChars,
    generateWithAi,
    stopGeneration,
    canGenerateAi,
  } = useAiSopGenerator(
    manualTitle,
    manualCategory,
    manualScope,
    setManualContent,
    manualSubmitting
  );

  return (
    <form onSubmit={onManualSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="manualDocTitle" className="text-xs font-medium text-foreground">
            Judul SOP / Catatan Teknis <span className="text-destructive">*</span>
          </Label>
          <Input
            id="manualDocTitle"
            type="text"
            placeholder="Contoh: Standar Redaman GPON 1:64"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            required
            className="text-xs h-9 bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="manualDocCategory" className="text-xs font-medium text-foreground">
            Kategori
          </Label>
          <select
            id="manualDocCategory"
            value={manualCategory}
            onChange={(e) => setManualCategory(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Scope Visibilitas & Hak Akses</span>
          <span className="text-[11px] font-normal text-foreground/75 dark:text-muted-foreground">
            Isolasi Multi-Tenant
          </span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {KNOWLEDGE_SCOPES.map((item) => {
            const isSelected = manualScope === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setManualScope?.(item.id)}
                className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? `${item.accentBorder} ${item.accentBg} ring-1 ring-primary/40`
                    : "border-border bg-background hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                    <span className="text-xs font-semibold text-foreground">
                      {item.shortLabel}
                    </span>
                  </div>
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-[10px] text-foreground/75 dark:text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">Mode Approval Dokumen</p>
          <p className="text-[11px] text-foreground/75 dark:text-muted-foreground">
            {manualAutoApprove
              ? "Langsung dipublikasikan & diindeks ke pgvector (Super Admin)."
              : "Simpan sebagai draf pending untuk di-review terlebih dahulu."}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={manualAutoApprove}
            onChange={(e) => setManualAutoApprove?.(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
        </label>
      </div>

      <div className="space-y-1.5">
        <AiEditorHeader
          manualTitle={manualTitle}
          manualCategory={manualCategory}
          manualScope={manualScope}
          aiGenerating={aiGenerating}
          aiGeneratedChars={aiGeneratedChars}
          canGenerateAi={canGenerateAi}
          onGenerateWithAi={generateWithAi}
          onStopGeneration={stopGeneration}
          onGoToTemplates={onGoToTemplates}
        />

        <AiRichEditor
          value={manualContent}
          onChange={(val) => setManualContent(val)}
          placeholder="# Standar Redaman GPON 1:64&#10;&#10;- Batas minimum: -27 dBm&#10;- Batas ideal: -15 s/d -22 dBm&#10;- Prosedur perbaikan FO cut..."
          disabled={manualSubmitting || aiGenerating}
          minHeight="380px"
        />
      </div>

      <div className="flex items-center justify-end pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={manualSubmitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={manualSubmitting || !manualTitle.trim() || !manualContent.trim()}
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            {manualSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Memvektorisasi...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {manualAutoApprove ? "Simpan & Publikasikan" : "Simpan sebagai Draf"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
