import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Badge,
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
      <Collapsible defaultOpen className="w-full space-y-1 pt-2.5 border-groove-t">
        <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/20 uppercase tracking-widest hover:text-foreground group select-none">
          <span className="flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-muted-foreground/70 group-hover:text-foreground dark:text-muted-foreground/80" />
            <span>Saved Presets</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1 py-0 h-3.5 border-border bg-muted/40 text-muted-foreground"
            >
              {presets.length}
            </Badge>
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60 group-hover:text-foreground dark:text-muted-foreground/70" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1 mt-1">
          <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar-thin pr-1 font-sans">
            {presets.map((p) => {
              return (
                <div
                  key={p.id}
                  onClick={() => handleApply(p)}
                  title={`${p.name}\n${p.description || "Click to apply this investigation filter preset"}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/70 transition-colors cursor-pointer group text-xs text-foreground"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 group-hover:bg-foreground/70 transition-colors shrink-0" />
                    <span
                      title={p.name}
                      className="truncate font-medium text-[11px] group-hover:text-foreground transition-colors select-none text-muted-foreground"
                    >
                      {p.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {p.isSystem ? (
                      <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-muted/70 text-muted-foreground/70 border border-border/30">
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
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 mt-1 rounded-md border border-dashed border-border/80 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-muted-foreground" />
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
