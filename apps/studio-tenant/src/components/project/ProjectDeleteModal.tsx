import * as React from "react";
import {
  Trash2,
  Download,
  Layers,
  Network,
  Users,
  Server,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type Project } from "../../hooks/useProjects";
import { handleExportSpatial } from "./project-utils";

export interface ProjectDeleteModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: (reason?: string, notes?: string) => Promise<void> | void;
  isDeleting: boolean;
}

export function ProjectDeleteModal({
  project,
  open,
  onOpenChange,
  onConfirmDelete,
  isDeleting,
}: ProjectDeleteModalProps) {
  const { t, formatNumber } = useTranslation();
  const [reason, setReason] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [confirmCodeInput, setConfirmCodeInput] = React.useState<string>("");
  const [exportingBackup, setExportingBackup] = React.useState<boolean>(false);

  // Reset inputs when modal opens or target project changes
  React.useEffect(() => {
    if (open) {
      setReason("");
      setNotes("");
      setConfirmCodeInput("");
    }
  }, [open, project?.id]);

  if (!project) return null;

  const isCodeMatch =
    confirmCodeInput.trim().toUpperCase() === (project.code || "").trim().toUpperCase();

  const isDeleteEnabled = isCodeMatch && reason.length > 0 && !isDeleting;

  const handleExport = () => {
    setExportingBackup(true);
    try {
      handleExportSpatial(project, t("projects.import_success") || "Backup exported successfully");
    } finally {
      setTimeout(() => setExportingBackup(false), 600);
    }
  };

  const handleProceedDelete = async () => {
    if (!isDeleteEnabled) return;
    await onConfirmDelete(reason, notes);
  };

  const totalNodes = (project.odcCount || 0) + (project.odpCount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/80 bg-card">
        {/* Header Hero */}
        <div className="relative p-5 bg-gradient-to-b from-destructive/10 via-destructive/5 to-transparent border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive border border-destructive/30 shadow-xs shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogHeader className="text-left space-y-0.5">
              <DialogTitle className="text-base font-bold text-foreground">
                {t("projects.delete_modal_header")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                {project.name} <span className="font-bold text-foreground">({project.code})</span> •{" "}
                {project.region || "Coverage Area"}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* 1. Impact Summary Cards */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/90 flex items-center justify-between">
              <span>{t("projects.delete_impact_summary_title")}</span>
              <span className="text-[10px] font-mono text-muted-foreground">ID: {project.id.slice(0, 8)}...</span>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center justify-center text-center">
                <Layers className="w-4 h-4 text-amber-500 mb-1" />
                <span className="text-sm font-mono font-bold text-foreground">{totalNodes}</span>
                <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-full">
                  {t("projects.delete_impact_nodes")}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center justify-center text-center">
                <Network className="w-4 h-4 text-sky-400 mb-1" />
                <span className="text-sm font-mono font-bold text-foreground">
                  {(project.cableLengthKm || 0).toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-full">
                  Km Cable
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center justify-center text-center">
                <Users className="w-4 h-4 text-primary mb-1" />
                <span className="text-sm font-mono font-bold text-foreground">
                  {formatNumber(project.totalSubscribers || 0)}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-full">
                  {t("projects.delete_impact_subscribers")}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center justify-center text-center">
                <Server className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-sm font-mono font-bold text-foreground">
                  {project.oltCount || 1}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-full">
                  {t("projects.delete_impact_olts")}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Export Spatial Backup Banner */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{t("projects.delete_export_banner_title")}</span>
              </span>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {t("projects.delete_export_banner_desc")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportingBackup}
              className="h-7.5 px-2.5 text-xs font-medium shrink-0 border-border bg-card hover:bg-muted cursor-pointer gap-1.5"
            >
              {exportingBackup ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{t("projects.delete_export_btn")}</span>
            </Button>
          </div>

          {/* 3. Reason for Deletion */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/90">
              {t("projects.delete_reason_label")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-8 text-xs bg-muted/30 border-border/80">
                <SelectValue placeholder={t("projects.delete_reason_placeholder")} />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="COMPLETED">{t("projects.delete_reason_completed")}</SelectItem>
                <SelectItem value="TESTING">{t("projects.delete_reason_testing")}</SelectItem>
                <SelectItem value="QUOTA_CLEANUP">{t("projects.delete_reason_quota")}</SelectItem>
                <SelectItem value="OTHER">{t("projects.delete_reason_other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Optional Reason Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              {t("projects.delete_notes_label")}
            </Label>
            <Input
              type="text"
              placeholder={t("projects.delete_notes_placeholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs bg-muted/20 border-border/80"
            />
          </div>

          {/* 5. Safety Double Confirmation Code Verification */}
          <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[11px] text-destructive/90 leading-relaxed font-medium">
                {t("projects.delete_confirm_desc", {
                  name: project.name,
                  code: project.code,
                })}
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold text-foreground">
                {t("projects.delete_code_verification_label", { code: project.code })}
              </Label>
              <Input
                type="text"
                placeholder={t("projects.delete_code_placeholder", { code: project.code })}
                value={confirmCodeInput}
                onChange={(e) => setConfirmCodeInput(e.target.value)}
                className="h-8 text-xs font-mono bg-background border-border/80 focus-visible:ring-destructive"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs"
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleProceedDelete}
            disabled={!isDeleteEnabled}
            className="text-xs font-semibold gap-1.5 shadow-xs"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t("projects.delete_permanent_cta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
