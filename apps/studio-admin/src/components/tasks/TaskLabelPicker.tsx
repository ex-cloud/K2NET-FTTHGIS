"use client";

import React, { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@k2net/ui";
import {
  Tag,
  ChevronDown,
  ChevronLeft,
  Search,
  Plus,
  Check,
  Building2,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types & Defaults ─────────────────────────────────────────────────────────

export interface TaskLabel {
  id: string;
  name: string;
  colorName: string;
  dotColor: string;
  badgeColor: string;
  scope?: "Workspace" | "K2net";
}

export const DEFAULT_LABELS: TaskLabel[] = [
  { id: "bug", name: "Bug", colorName: "Red", dotColor: "bg-red-500", badgeColor: "bg-red-500/10 text-red-500 border-red-500/20" },
  { id: "feature", name: "Feature", colorName: "Purple", dotColor: "bg-purple-500", badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { id: "improvement", name: "Improvement", colorName: "Blue", dotColor: "bg-blue-500", badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
];

export const LABEL_COLORS = [
  { name: "Grey", dotColor: "bg-muted-foreground/60", badgeColor: "bg-muted text-muted-foreground border-border" },
  { name: "Dark Grey", dotColor: "bg-foreground/70", badgeColor: "bg-card text-foreground/80 border-border" },
  { name: "Purple", dotColor: "bg-purple-500", badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { name: "Teal", dotColor: "bg-teal-500", badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/20" },
  { name: "Green", dotColor: "bg-primary", badgeColor: "bg-primary/10 text-primary border-primary/20" },
  { name: "Yellow", dotColor: "bg-yellow-500", badgeColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  { name: "Orange", dotColor: "bg-orange-500", badgeColor: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { name: "Pink", dotColor: "bg-pink-500", badgeColor: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
  { name: "Red", dotColor: "bg-red-500", badgeColor: "bg-red-500/10 text-red-500 border-red-500/20" },
];

interface TaskLabelPickerProps {
  selectedLabelIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function TaskLabelPicker({
  selectedLabelIds,
  onChange,
  className,
}: TaskLabelPickerProps) {
  const [allLabels, setAllLabels] = useState<TaskLabel[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("k2net_custom_labels");
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return DEFAULT_LABELS;
  });

  const [labelSearch, setLabelSearch] = useState("");
  const [labelStep, setLabelStep] = useState<"search" | "pick_scope" | "pick_color">("search");
  const [newLabelDraft, setNewLabelDraft] = useState<{ name: string; scope: "Workspace" | "K2net" }>({
    name: "",
    scope: "Workspace",
  });

  const toggleLabel = (labelId: string) => {
    onChange(
      selectedLabelIds.includes(labelId)
        ? selectedLabelIds.filter((id) => id !== labelId)
        : [...selectedLabelIds, labelId]
    );
  };

  const handleStartCreateLabel = (name: string) => {
    setNewLabelDraft({ name: name.trim(), scope: "Workspace" });
    setLabelStep("pick_scope");
  };

  const handleSelectScope = (scope: "Workspace" | "K2net") => {
    setNewLabelDraft((prev) => ({ ...prev, scope }));
    setLabelStep("pick_color");
  };

  const handleSelectColorAndFinishLabel = (colorItem: typeof LABEL_COLORS[0]) => {
    const rawSlug = newLabelDraft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const id = rawSlug || "custom-label";
    const newLbl: TaskLabel = {
      id,
      name: newLabelDraft.name,
      colorName: colorItem.name,
      dotColor: colorItem.dotColor,
      badgeColor: colorItem.badgeColor,
      scope: newLabelDraft.scope,
    };

    const updated = [...allLabels, newLbl];
    setAllLabels(updated);
    try {
      localStorage.setItem("k2net_custom_labels", JSON.stringify(updated));
    } catch { /* ignore */ }

    // Auto-select the newly created label
    onChange(Array.from(new Set([...selectedLabelIds, id])));
    toast.success(`Label "${newLbl.name}" berhasil dibuat`);

    // Reset wizard
    setLabelSearch("");
    setLabelStep("search");
  };

  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return allLabels;
    const q = labelSearch.toLowerCase();
    return allLabels.filter((l) => l.name.toLowerCase().includes(q));
  }, [allLabels, labelSearch]);

  const exactLabelMatch = useMemo(() => {
    return allLabels.some((l) => l.name.toLowerCase() === labelSearch.trim().toLowerCase());
  }, [allLabels, labelSearch]);

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) { setLabelSearch(""); setLabelStep("search"); } }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors",
            selectedLabelIds.length > 0
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50",
            className
          )}
        >
          <Tag className="h-3 w-3 shrink-0" />
          <span>{selectedLabelIds.length > 0 ? `${selectedLabelIds.length} Labels` : "Labels"}</span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-64 z-[100] p-1.5" onClick={(e) => e.stopPropagation()}>
        
        {/* ── STEP 1: Search & Select or Create Label ───────────────── */}
        {labelStep === "search" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/40 rounded-lg border border-border/50">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Add labels..."
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && labelSearch.trim() && !exactLabelMatch) {
                    handleStartCreateLabel(labelSearch);
                  }
                }}
                className="w-full text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
              />
              <span className="text-[10px] text-muted-foreground/60 font-mono">L</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1">
              {filteredLabels.map((lbl) => {
                const isSelected = selectedLabelIds.includes(lbl.id);
                return (
                  <div
                    key={lbl.id}
                    onClick={() => toggleLabel(lbl.id)}
                    className={cn(
                      "flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md cursor-pointer transition-colors",
                      isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", lbl.dotColor)} />
                      <span>{lbl.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                );
              })}

              {filteredLabels.length === 0 && !labelSearch.trim() && (
                <p className="text-[11px] text-muted-foreground text-center py-2">Belum ada label.</p>
              )}
            </div>

            {/* Option to create new label if search term doesn't match */}
            {labelSearch.trim() && !exactLabelMatch && (
              <div className="pt-1 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => handleStartCreateLabel(labelSearch)}
                  className="w-full flex items-center gap-2 text-xs py-1.5 px-2.5 text-primary hover:bg-primary/10 rounded-md font-semibold text-left transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Create new label: &ldquo;{labelSearch.trim()}&rdquo;</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Pick a Scope for Label ───────────────────────── */}
        {labelStep === "pick_scope" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 border-b border-border/40 mb-1">
              <button
                type="button"
                onClick={() => setLabelStep("search")}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-semibold text-muted-foreground">Pick a scope for label</span>
              <div className="w-5" />
            </div>

            <button
              type="button"
              onClick={() => handleSelectScope("Workspace")}
              className="w-full flex items-center gap-2 text-xs py-2 px-2.5 hover:bg-muted/50 rounded-md text-left text-foreground transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectScope("K2net")}
              className="w-full flex items-center gap-2 text-xs py-2 px-2.5 hover:bg-muted/50 rounded-md text-left text-foreground transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>K2net</span>
            </button>
          </div>
        )}

        {/* ── STEP 3: Pick a Color for Label ───────────────────────── */}
        {labelStep === "pick_color" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 border-b border-border/40 mb-1">
              <button
                type="button"
                onClick={() => setLabelStep("pick_scope")}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-semibold text-muted-foreground">Pick a color for label</span>
              <div className="w-5" />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {LABEL_COLORS.map((col) => (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => handleSelectColorAndFinishLabel(col)}
                  className="w-full flex items-center gap-2 text-xs py-1.5 px-2.5 hover:bg-muted/50 rounded-md text-left text-foreground transition-colors"
                >
                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", col.dotColor)} />
                  <span>{col.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
