import * as React from "react";
import { RotateCcw, Archive, Trash2, Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type Project } from "../../hooks/useProjects";

export interface ProjectActionDialogsProps {
  restoreProject: Project | null;
  archiveProject: Project | null;
  deleteProject: Project | null;
  isProcessing: boolean;
  onCloseRestore: () => void;
  onCloseArchive: () => void;
  onCloseDelete: () => void;
  onConfirmRestore: () => void;
  onConfirmArchive: () => void;
  onConfirmDelete: () => void;
}

export function ProjectActionDialogs({
  restoreProject,
  archiveProject,
  deleteProject,
  isProcessing,
  onCloseRestore,
  onCloseArchive,
  onCloseDelete,
  onConfirmRestore,
  onConfirmArchive,
  onConfirmDelete,
}: ProjectActionDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* ── Restore Project Confirmation Dialog ─────────────────────────── */}
      <Dialog open={!!restoreProject} onOpenChange={(open) => !open && onCloseRestore()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
              <RotateCcw className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {t("projects.restore_confirm_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("projects.restore_confirm_desc")}
            </DialogDescription>
          </DialogHeader>

          {restoreProject && (
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30 text-xs font-mono">
              <div className="flex justify-between items-center text-foreground">
                <span className="font-bold">{restoreProject.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                  {restoreProject.code}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseRestore}
              disabled={isProcessing}
              className="text-xs"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onConfirmRestore}
              disabled={isProcessing}
              className="text-xs font-semibold gap-1.5"
            >
              {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("projects.restore_project")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Archive Project Confirmation Dialog ─────────────────────────── */}
      <Dialog open={!!archiveProject} onOpenChange={(open) => !open && onCloseArchive()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-1">
              <Archive className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {t("projects.archive_confirm_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("projects.archive_confirm_desc")}
            </DialogDescription>
          </DialogHeader>

          {archiveProject && (
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30 text-xs font-mono">
              <div className="flex justify-between items-center text-foreground">
                <span className="font-bold">{archiveProject.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                  {archiveProject.code}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseArchive}
              disabled={isProcessing}
              className="text-xs"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onConfirmArchive}
              disabled={isProcessing}
              className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("projects.archive_project")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Project Danger Confirmation Dialog ───────────────────── */}
      <Dialog open={!!deleteProject} onOpenChange={(open) => !open && onCloseDelete()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive mb-1">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              {t("projects.delete_confirm_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {deleteProject &&
                t("projects.delete_confirm_desc", {
                  name: deleteProject.name,
                  code: deleteProject.code,
                })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseDelete}
              disabled={isProcessing}
              className="text-xs"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isProcessing}
              className="text-xs font-semibold gap-1.5"
            >
              {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("projects.delete_project")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
