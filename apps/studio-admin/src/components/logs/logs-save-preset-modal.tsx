import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
} from "@k2net/ui";
import { Bookmark, Check, Layers } from "lucide-react";
import { toast } from "sonner";
import { useLogsFilter, LOG_TYPES_LABELS } from "./logs-filter-context";
import {
  type InvestigationPreset,
  loadSavedPresets,
  saveCustomPresets,
} from "./logs-presets-types";

export interface LogsSavePresetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPresetSaved?: (preset: InvestigationPreset) => void;
}

export function LogsSavePresetModal({
  open,
  onOpenChange,
  onPresetSaved,
}: LogsSavePresetModalProps) {
  const {
    timeRange,
    selectedTypes,
    selectedLevels,
    selectedSeverities,
    scopeFilter,
    projectFilter,
    tenantFilter,
    searchQuery,
    advancedFilters,
    includeBenchmark,
  } = useLogsFilter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(`Investigation ${new Date().toLocaleDateString("id-ID")}`);
      setDescription("");
    }
  }, [open]);

  // Active Filter Summary Pills
  const activePills = useMemo(() => {
    const list: string[] = [];
    list.push(`Time: ${timeRange}`);
    Object.entries(selectedTypes).filter(([, a]) => a).forEach(([k]) => list.push(`Type: ${LOG_TYPES_LABELS[k] ?? k}`));
    Object.entries(selectedLevels).filter(([, a]) => a).forEach(([k]) => list.push(`Level: ${k}`));
    Object.entries(selectedSeverities).filter(([, a]) => a).forEach(([k]) => list.push(`Severity: ${k}`));
    if (scopeFilter && scopeFilter !== "ALL") list.push(`Scope: ${scopeFilter}`);
    if (tenantFilter) list.push(`Tenant: ${tenantFilter}`);
    if (projectFilter) list.push(`Project: ${projectFilter}`);
    if (searchQuery) list.push(`Search: "${searchQuery}"`);
    if (includeBenchmark) list.push("Benchmarks");
    advancedFilters.forEach((f) => list.push(`${f.field} ${f.operator} ${f.value}`));
    return list;
  }, [
    timeRange,
    selectedTypes,
    selectedLevels,
    selectedSeverities,
    scopeFilter,
    projectFilter,
    tenantFilter,
    searchQuery,
    includeBenchmark,
    advancedFilters,
  ]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the investigation preset.");
      return;
    }

    const newPreset: InvestigationPreset = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      colorTag: "neutral",
      isSystem: false,
      createdAt: new Date().toISOString(),
      filters: {
        timeRange,
        selectedTypes: { ...selectedTypes },
        selectedLevels: { ...selectedLevels },
        selectedSeverities: { ...selectedSeverities },
        scopeFilter,
        projectFilter,
        tenantFilter,
        searchQuery,
        advancedFilters: [...advancedFilters],
        includeBenchmark,
      },
    };

    const currentPresets = loadSavedPresets();
    const updatedCustom = [...currentPresets.filter((p) => !p.isSystem), newPreset];
    saveCustomPresets(updatedCustom);

    toast.success(`Investigation preset "${newPreset.name}" saved.`);
    onPresetSaved?.(newPreset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card text-card-foreground border-border shadow-2xl p-0 font-sans rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20">
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground border border-border/60 shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-xs font-bold text-foreground">
                  Save Investigation Preset
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                  Bookmark current search parameters for fast 1-click forensic analysis.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-3 text-xs">
          {/* Preset Name */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Preset Name *
            </label>
            <input
              type="text"
              placeholder="e.g. OLT Outage Investigation - Oct 3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-border focus:ring-1 focus:ring-foreground/20 selection:bg-muted-foreground/30 selection:text-foreground font-mono placeholder:text-muted-foreground/50 shadow-2xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add investigation context or case reference ID..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:border-border focus:ring-1 focus:ring-foreground/20 selection:bg-muted-foreground/30 selection:text-foreground font-mono resize-none placeholder:text-muted-foreground/50 shadow-2xs"
            />
          </div>

          {/* Captured Filter Snapshot Preview */}
          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/15 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Active Filter Snapshot ({activePills.length})</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar-thin">
              {activePills.map((pill, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="px-1.5 py-0 text-[9px] font-mono border-border bg-card text-muted-foreground h-4"
                >
                  {pill}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2 select-none">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-7.5 px-3 cursor-pointer border-border"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!name.trim()}
            className="text-xs h-7.5 px-3 font-semibold gap-1.5 cursor-pointer bg-foreground text-background hover:bg-foreground/90 border border-foreground shadow-xs disabled:opacity-40 font-sans"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preset</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
