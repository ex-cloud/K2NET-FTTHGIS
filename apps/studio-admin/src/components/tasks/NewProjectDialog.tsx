import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from "@k2net/ui";
import { FolderKanban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TaskScope } from "@/hooks/useTasksQuery";
import { PROJECT_ICONS } from "./new-project-constants";
import { NewProjectPropertyPills } from "./NewProjectPropertyPills";
import { NewProjectMilestones } from "./NewProjectMilestones";
import { NewProjectEditorSection } from "./NewProjectEditorSection";
import { useNewProjectForm } from "./use-new-project-form";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: {
    title?: string;
    summary?: string;
    description?: string;
    scope?: TaskScope;
    priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
    status?: string;
    leadId?: string;
    targetDate?: string;
  };
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: NewProjectDialogProps) {
  const form = useNewProjectForm({ open, onOpenChange, onSuccess, defaultValues });
  const IconComponent = form.activeIconObj.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-full sm:max-w-[860px] p-0 bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col gap-0 max-h-[90vh]"
      >
        {/* ── Top Header / Breadcrumb ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary/80 text-xs font-medium text-foreground">
            <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
            <span>K2N</span>
            <span className="text-muted-foreground/60">›</span>
            <span className="font-semibold text-foreground">New project plan</span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Inisiatif Roadmap &amp; Arsitektur Payung
          </span>
        </div>

        {/* ── Form Body ──────────────────────────────────────────────────── */}
        <form onSubmit={form.handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar-thin">
            {/* Project Icon Selector + Name Input */}
            <div className="flex items-start gap-3.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Pilih Icon Projek"
                    className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all hover:scale-105 cursor-pointer shadow-sm mt-0.5",
                      form.activeIconObj.color
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 p-1.5 grid grid-cols-4 gap-1.5 z-[150]">
                  {PROJECT_ICONS.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => form.setSelectedIconId(item.id)}
                        className={cn(
                          "p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                          form.selectedIconId === item.id ? "bg-accent border border-primary/40" : "hover:bg-muted"
                        )}
                      >
                        <ItemIcon className={cn("w-4 h-4", item.color.split(" ")[0])} />
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 space-y-1 min-w-0">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => form.setName(e.target.value)}
                  placeholder="Project plan name (e.g. Core Engine V2 Refactoring)"
                  autoFocus
                  required
                  className="w-full text-xl font-bold font-sans tracking-tight text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/40 leading-tight"
                />
                <input
                  type="text"
                  value={form.summary}
                  onChange={(e) => form.setSummary(e.target.value)}
                  placeholder="Executive summary / tujuan ringkas inisiatif..."
                  className="w-full text-xs text-foreground/80 placeholder:text-muted-foreground/40 bg-transparent border-0 focus:outline-none"
                />
              </div>
            </div>

            {/* ── Linear Horizontal Property Pills ─────────────────────────── */}
            <NewProjectPropertyPills
              status={form.status}
              setStatus={form.setStatus}
              priority={form.priority}
              setPriority={form.setPriority}
              leadName={form.leadName}
              setLeadName={form.setLeadName}
              teamUsers={form.teamUsers}
              currentUserName={form.session?.user?.name}
              currentUserEmail={form.session?.user?.email}
              startDate={form.startDate}
              onStartDateChange={form.handleStartDateChange}
              targetDate={form.targetDate}
              onTargetDateChange={form.handleTargetDateChange}
              selectedLabels={form.selectedLabels}
              setSelectedLabels={form.setSelectedLabels}
            />

            {/* ── TipTap Markdown Project Plan Editor ───────────────────────── */}
            <NewProjectEditorSection
              description={form.description}
              setDescription={form.setDescription}
              onUploadImage={form.handleUploadImage}
            />

            {/* ── Milestones Section ───────────────────────────────────────── */}
            <NewProjectMilestones
              milestones={form.milestones}
              onAddMilestone={form.handleAddMilestone}
              onRemoveMilestone={(id) => form.setMilestones((prev) => prev.filter((m) => m.id !== id))}
              showMilestoneInput={form.showMilestoneInput}
              setShowMilestoneInput={form.setShowMilestoneInput}
              newMilestoneText={form.newMilestoneText}
              setNewMilestoneText={form.setNewMilestoneText}
            />
          </div>

          {/* ── Modal Footer ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border/40 bg-muted/20 shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Tip: Gunakan TipTap Markdown untuk menyusun format tabel &amp; checklist
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.isSubmitting || !form.name.trim()}
                className="h-8 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {form.isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membuat Project...</span>
                  </>
                ) : (
                  <span>Create project plan</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
