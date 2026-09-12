import { Dialog, DialogContent } from "@k2net/ui";
import { Loader2, Paperclip, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TaskScope } from "@/hooks/useTasksQuery";
import { NewTaskPropertyPills } from "./NewTaskPropertyPills";
import { useNewTaskForm } from "./use-new-task-form";

export interface NewTaskDefaultValues {
  title?: string;
  description?: string;
  scope?: TaskScope;
  type?: "TICKET" | "PROJECT";
  project?: string;
  parentTaskId?: string;
  priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  status?: string;
}

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  assigneesList?: string[];
  projectsList?: string[];
  defaultValues?: NewTaskDefaultValues;
}

export function NewTaskDialog({
  open,
  onOpenChange,
  onSuccess,
  assigneesList = [],
  projectsList = [],
  defaultValues,
}: NewTaskDialogProps) {
  const form = useNewTaskForm({ open, onOpenChange, onSuccess, defaultValues });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-full sm:max-w-[660px] p-0 bg-card/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col gap-0"
      >
        {/* ── Linear-Style Header Bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-background/50 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
              K2N
            </span>
            <span>›</span>
            <span className="text-foreground">
              {form.type === "PROJECT" || form.selectedProject ? "New Project Issue" : "New Issue"}
            </span>
          </div>

          {!defaultValues?.parentTaskId && (
            <div className="flex items-center gap-1 pr-6">
              <button
                type="button"
                onClick={() => form.setType(form.type === "TICKET" ? "PROJECT" : "TICKET")}
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors border",
                  form.type === "PROJECT"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {form.type === "PROJECT" ? "Project Mode" : "Issue Mode"}
              </button>
            </div>
          )}
        </div>

        {/* ── Form Canvas ──────────────────────────────────────────────── */}
        <form onSubmit={form.handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            <input
              type="text"
              autoFocus
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="Issue title..."
              className="w-full text-lg font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0"
            />

            <textarea
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
              placeholder="Add description... (supports markdown)"
              rows={4}
              className="w-full text-sm text-foreground/90 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-0 leading-relaxed"
            />
          </div>

          {/* ── Linear Inline Pill Bar ─────────────────────────────────── */}
          <NewTaskPropertyPills
            status={form.status}
            setStatus={form.setStatus}
            priority={form.priority}
            setPriority={form.setPriority}
            assigneeId={form.assigneeId}
            setAssigneeId={form.setAssigneeId}
            assigneesList={assigneesList}
            selectedProject={form.selectedProject}
            setSelectedProject={form.setSelectedProject}
            projectsList={projectsList}
            dueDate={form.dueDate}
            setDueDate={form.setDueDate}
            selectedLabels={form.selectedLabels}
            setSelectedLabels={form.setSelectedLabels}
          />

          {/* ── Footer Actions ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-background/50 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={form.fileInputRef}
                type="file"
                className="hidden"
                onChange={form.handleFileUpload}
              />
              <button
                type="button"
                disabled={form.isUploadingFile}
                onClick={() => form.fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Attach file (Upload & compress via MinIO storage-gateway)"
              >
                {form.isUploadingFile ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Paperclip className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.createMore}
                  onChange={(e) => form.setCreateMore(e.target.checked)}
                  className="rounded border-border/80 text-primary focus:ring-0 cursor-pointer"
                />
                <span>Create more</span>
              </label>

              <button
                type="submit"
                disabled={!form.title.trim() || form.isSubmitting}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer",
                  form.title.trim() && !form.isSubmitting
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {form.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create {form.type === "PROJECT" || form.selectedProject ? "Project Issue" : "Issue"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
