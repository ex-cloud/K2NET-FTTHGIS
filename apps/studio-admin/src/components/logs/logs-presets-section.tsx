import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Badge,
  cn,
} from "@k2net/ui";
import {
  Bookmark,
  ChevronDown,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useLogsFilter } from "./logs-filter-context";
import {
  type InvestigationPreset,
  loadSavedPresets,
  saveCustomPresets,
} from "./logs-presets-types";
import { LogsSavePresetModal } from "./logs-save-preset-modal";

const COLOR_ACCENTS: Record<string, { dot: string; text: string }> = {
  red: { dot: "bg-destructive", text: "text-destructive" },
  amber: { dot: "bg-amber-500", text: "text-amber-500" },
  emerald: { dot: "bg-primary", text: "text-primary" },
  blue: { dot: "bg-sky-400", text: "text-sky-400" },
  purple: { dot: "bg-purple-400", text: "text-purple-400" },
  neutral: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

export function PresetsFilterSection() {
  const { applyPreset } = useLogsFilter();
  const [presets, setPresets] = React.useState<InvestigationPreset[]>([]);
  const [showSaveModal, setShowSaveModal] = React.useState(false);

  const refreshPresets = React.useCallback(() => {
    setPresets(loadSavedPresets());
  }, []);

  React.useEffect(() => {
    refreshPresets();
  }, [refreshPresets]);

  const handleApply = (preset: InvestigationPreset) => {
    applyPreset(preset);
    toast.success(`Investigation preset "${preset.name}" applied.`);
  };

  const handleDelete = (e: React.MouseEvent, presetId: string, name: string) => {
    e.stopPropagation();
    const updated = presets.filter((p) => p.id !== presetId);
    saveCustomPresets(updated);
    setPresets(updated);
    toast.success(`Preset "${name}" removed.`);
  };

  return (
    <>
      <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
        <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
          <span className="flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-primary" />
            <span>Saved Presets</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1 py-0 h-3.5 border-border bg-muted/40 text-muted-foreground"
            >
              {presets.length}
            </Badge>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1 mt-1">
          <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar-thin pr-1 font-sans">
            {presets.map((p) => {
              const accent = COLOR_ACCENTS[p.colorTag] || COLOR_ACCENTS.neutral;
              return (
                <div
                  key={p.id}
                  onClick={() => handleApply(p)}
                  title={p.description}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors cursor-pointer group text-xs text-foreground"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", accent.dot)} />
                    <span className="truncate font-medium text-[11px] group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {p.isSystem ? (
                      <span className="text-[9px] font-mono font-semibold px-1 rounded bg-muted text-muted-foreground">
                        SYS
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, p.id, p.name)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                        title="Delete preset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 mt-1 rounded-md border border-dashed border-border/80 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-primary" />
            <span>Save Current Search</span>
          </button>
        </CollapsibleContent>
      </Collapsible>

      <LogsSavePresetModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        onPresetSaved={() => refreshPresets()}
      />
    </>
  );
}
