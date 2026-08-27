"use client";

import {
  MessageSquare,
  Download,
  X,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { Button, ActionTooltip } from "@k2net/ui";

interface OrganizationBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkSuspend: () => void;
  onBulkResume: () => void;
  onBulkBroadcast: () => void;
  onBulkExport: () => void;
}

export function OrganizationBulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkSuspend,
  onBulkResume,
  onBulkBroadcast,
  onBulkExport,
}: OrganizationBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/80 bg-popover/90 backdrop-blur-xl shadow-2xl text-xs">
        {/* Selected Count Badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-border/60">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-mono text-[10px] font-bold">
            {selectedCount}
          </div>
          <span className="font-medium text-foreground">
            {selectedCount} organization{selectedCount > 1 ? "s" : ""} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <ActionTooltip label="Resume all selected organizations">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkResume}
              className="h-7 text-xs border-border bg-card/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-1.5"
            >
              <PlayCircle className="h-3 w-3" />
              <span>Resume</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip label="Suspend all selected organizations">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkSuspend}
              className="h-7 text-xs border-border bg-card/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 gap-1.5"
            >
              <PauseCircle className="h-3 w-3" />
              <span>Suspend</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip label="Send announcement notification to selected tenants">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkBroadcast}
              className="h-7 text-xs border-border bg-card/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 gap-1.5"
            >
              <MessageSquare className="h-3 w-3" />
              <span>Broadcast</span>
            </Button>
          </ActionTooltip>

          <ActionTooltip label="Export selected organizations to CSV">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              className="h-7 text-xs border-border bg-card/80 hover:bg-accent text-foreground gap-1.5"
            >
              <Download className="h-3 w-3" />
              <span>Export CSV</span>
            </Button>
          </ActionTooltip>
        </div>

        {/* Clear Selection Button */}
        <div className="pl-2 border-l border-border/60">
          <ActionTooltip label="Clear Selection" shortcut="Esc">
            <button
              onClick={onClearSelection}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>
        </div>
      </div>
    </div>
  );
}
