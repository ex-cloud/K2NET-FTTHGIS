import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from "@k2net/ui";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@k2net/i18n";
import { type TaskScope } from "@/hooks/useTasksQuery";
import {
  PROJECT_ICONS,
  WORKSPACE_SUBTYPES,
  type WorkspaceSubtype,
} from "./new-project-constants";
import { NewProjectPropertyPills } from "./NewProjectPropertyPills";
import { NewProjectMilestones } from "./NewProjectMilestones";
import { NewProjectEditorSection } from "./NewProjectEditorSection";
import { useNewProjectForm } from "./use-new-project-form";

export interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: {
    subtype?: WorkspaceSubtype;
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
  const { t } = useTranslation();
  const form = useNewProjectForm({ open, onOpenChange, onSuccess, defaultValues });
  const IconComponent = form.activeIconObj.icon;

  const currentSubtypeConfig =
    WORKSPACE_SUBTYPES.find((s) => s.id === form.subtype) || WORKSPACE_SUBTYPES[0];
  const SubtypeIcon = currentSubtypeConfig.icon;

  const getBreadcrumbTitle = () => {
    switch (form.subtype) {
      case "IDEA":
        return t("workspace.modal_title_idea");
      case "PROJECT":
        return t("workspace.modal_title_project");
      case "DOC":
        return t("workspace.modal_title_doc");
      default:
        return t("workspace.modal_title_plan");
    }
  };

  const getBreadcrumbSubtitle = () => {
    switch (form.subtype) {
      case "IDEA":
        return t("workspace.modal_desc_idea");
      case "PROJECT":
        return t("workspace.modal_desc_project");
      case "DOC":
        return t("workspace.modal_desc_doc");
      default:
        return t("workspace.modal_desc_plan");
    }
  };

  const getTitlePlaceholder = () => {
    switch (form.subtype) {
      case "IDEA":
        return t("workspace.title_placeholder_idea");
      case "PROJECT":
        return t("workspace.title_placeholder_project");
      case "DOC":
        return t("workspace.title_placeholder_doc");
      default:
        return t("workspace.title_placeholder_plan");
    }
  };

  const getSubmitButtonLabel = () => {
    switch (form.subtype) {
      case "IDEA":
        return t("workspace.btn_create_idea");
      case "PROJECT":
        return t("workspace.btn_create_project");
      case "DOC":
        return t("workspace.btn_create_doc");
      default:
        return t("workspace.btn_create_plan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-full sm:max-w-[880px] p-0 bg-card/95 backdrop-blur-2xl border border-border shadow-lg rounded-2xl overflow-hidden flex flex-col gap-0 max-h-[92vh]"
      >
        {/* ── Top Header / Breadcrumb ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary/80 text-xs font-medium text-foreground">
            <SubtypeIcon className={cn("w-3.5 h-3.5", currentSubtypeConfig.color.split(" ")[0])} />
            <span>K2N</span>
            <span className="text-muted-foreground/60">›</span>
            <span className="font-semibold text-foreground">{getBreadcrumbTitle()}</span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {getBreadcrumbSubtitle()}
          </span>
        </div>

        {/* ── Subtype Switcher Bar ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border/30 bg-muted/10 shrink-0 overflow-x-auto">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            {t("workspace.type_filter")}:
          </span>
          {WORKSPACE_SUBTYPES.map((sub) => {
            const SubIcon = sub.icon;
            const isSelected = form.subtype === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => form.handleSubtypeChange(sub.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                  isSelected
                    ? "bg-accent text-accent-foreground border-primary/50 shadow-xs"
                    : "bg-background/60 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground"
                )}
              >
                <SubIcon className={cn("size-3.5", sub.color.split(" ")[0])} />
                <span>
                  {sub.id === "PLAN"
                    ? t("workspace.subtype_plan")
                    : sub.id === "IDEA"
                    ? t("workspace.subtype_idea")
                    : sub.id === "PROJECT"
                    ? t("workspace.subtype_project")
                    : t("workspace.subtype_doc")}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/70 uppercase">
                  ({sub.codePrefix})
                </span>
              </button>
            );
          })}
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
                    title={t("tasks.select_project_icon")}
                    className={cn(
                      "w-8 h-8 rounded-md border flex items-center justify-center shrink-0 transition-all hover:scale-105 cursor-pointer shadow-xs mt-0.5",
                      form.activeIconObj.color
                    )}
                  >
                    <IconComponent className="size-4" />
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
                  placeholder={getTitlePlaceholder()}
                  autoFocus
                  required
                  className="w-full text-xl font-bold font-sans tracking-tight text-foreground bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/40 leading-tight"
                />
                <input
                  type="text"
                  value={form.summary}
                  onChange={(e) => form.setSummary(e.target.value)}
                  placeholder={t("workspace.summary_placeholder")}
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
              subtype={form.subtype}
              description={form.description}
              setDescription={form.setDescription}
              onUploadImage={form.handleUploadImage}
            />

            {/* ── Milestones Section (Only for PROJECT and PLAN) ───────────── */}
            {(form.subtype === "PROJECT" || form.subtype === "PLAN") && (
              <NewProjectMilestones
                milestones={form.milestones}
                onAddMilestone={form.handleAddMilestone}
                onRemoveMilestone={(id) => form.setMilestones((prev) => prev.filter((m) => m.id !== id))}
                showMilestoneInput={form.showMilestoneInput}
                setShowMilestoneInput={form.setShowMilestoneInput}
                newMilestoneText={form.newMilestoneText}
                setNewMilestoneText={form.setNewMilestoneText}
              />
            )}
          </div>

          {/* ── Modal Footer ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border/40 bg-muted/20 shrink-0">
            <span className="text-[11px] text-muted-foreground">
              {t("workspace.tip_markdown")}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground h-7 px-2.5 rounded-md"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={form.isSubmitting || !form.name.trim()}
                className="h-7 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {form.isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("common.saving")}</span>
                  </>
                ) : (
                  <span>{getSubmitButtonLabel()}</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
