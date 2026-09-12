import React from "react";
import { Target, Plus, Trash2 } from "lucide-react";
import { Button } from "@k2net/ui";

interface MilestoneItem {
  id: string;
  title: string;
}

interface NewProjectMilestonesProps {
  milestones: MilestoneItem[];
  onAddMilestone: () => void;
  onRemoveMilestone: (id: string) => void;
  showMilestoneInput: boolean;
  setShowMilestoneInput: (show: boolean) => void;
  newMilestoneText: string;
  setNewMilestoneText: (text: string) => void;
}

export const NewProjectMilestones: React.FC<NewProjectMilestonesProps> = ({
  milestones,
  onAddMilestone,
  onRemoveMilestone,
  showMilestoneInput,
  setShowMilestoneInput,
  newMilestoneText,
  setNewMilestoneText,
}) => {
  return (
    <div className="pt-2 border-t border-border/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground/90 tracking-wide flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-500" />
          <span>Key Milestones &amp; Checkpoints</span>
        </span>
        <button
          type="button"
          onClick={() => setShowMilestoneInput(true)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1 text-xs"
          title="Tambah Milestone"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Milestone</span>
        </button>
      </div>

      {milestones.length > 0 && (
        <div className="space-y-1.5">
          {milestones.map((m, idx) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/40 text-xs text-foreground"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-500">M{idx + 1}</span>
                <span>{m.title}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMilestone(m.id)}
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showMilestoneInput && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newMilestoneText}
            onChange={(e) => setNewMilestoneText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddMilestone();
              }
            }}
            placeholder="Nama target milestone (e.g. Phase 1: Core Engine Integration)"
            autoFocus
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            type="button"
            size="sm"
            onClick={onAddMilestone}
            className="h-7 text-xs px-2.5 bg-secondary text-foreground hover:bg-secondary/80"
          >
            Tambah
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowMilestoneInput(false)}
            className="h-7 text-xs px-2"
          >
            Batal
          </Button>
        </div>
      )}
    </div>
  );
};
