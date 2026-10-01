import React from "react";
import {
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { TrashItem } from "@/hooks/useTrashCan";

interface TrashDialogsProps {
  activeItemToRestore: TrashItem | null;
  onCloseRestore: () => void;
  onConfirmRestore: () => void;
  activeItemToDelete: TrashItem | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  showEmptyConfirm: boolean;
  onCloseEmptyConfirm: () => void;
  onConfirmEmptyTrash: () => void;
  isProcessing: boolean;
  totalStats: number;
}

export function TrashDialogs({
  activeItemToRestore,
  onCloseRestore,
  onConfirmRestore,
  activeItemToDelete,
  onCloseDelete,
  onConfirmDelete,
  showEmptyConfirm,
  onCloseEmptyConfirm,
  onConfirmEmptyTrash,
  isProcessing,
  totalStats,
}: TrashDialogsProps) {
  const { t } = useTranslation();
  const restorePath = typeof activeItemToRestore?.details?.path === "string" ? activeItemToRestore.details.path : null;
  const deletePath = typeof activeItemToDelete?.details?.path === "string" ? activeItemToDelete.details.path : null;

  return (
    <>
      {/* Confirmation Dialog: Pre-flight Restore Single Item */}
      <Dialog
        open={!!activeItemToRestore}
        onOpenChange={(open) => !open && onCloseRestore()}
      >
        <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-xl border-border">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <RotateCcw className="h-5 w-5 text-primary" />
              <DialogTitle className="text-foreground">{t("common.trash_restore_title")}</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1.5 text-muted-foreground">
              {t("common.trash_restore_desc", { name: activeItemToRestore?.name || "" })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2.5">
            <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                {t("common.trash_restore_impact_title")}
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                {activeItemToRestore?.type === "ORGANIZATION" ? (
                  <>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span>{t("common.trash_restore_org_iam")}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span>{t("common.trash_restore_org_status")}</span>
                    </li>
                  </>
                ) : activeItemToRestore?.type === "DOCUMENT" ? (
                  <>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span>{t("common.trash_restore_doc_tab", { originName: activeItemToRestore.originName || "" })}</span>
                    </li>
                    {restorePath && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary font-bold">•</span>
                        <span>{t("common.trash_restore_file_path", { path: restorePath })}</span>
                      </li>
                    )}
                  </>
                ) : (
                  <li className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{t("common.trash_restore_generic")}</span>
                  </li>
                )}
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span>{t("common.trash_restore_retention")}</span>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseRestore}
              disabled={isProcessing}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmRestore}
              disabled={isProcessing}
              className="gap-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("common.trash_confirm_restore")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Permanent Delete Single Item */}
      <Dialog
        open={!!activeItemToDelete}
        onOpenChange={(open) => !open && onCloseDelete()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>{t("common.trash_delete_title")}</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              {activeItemToDelete?.type === "DOCUMENT"
                ? t("common.trash_delete_desc_doc", { name: activeItemToDelete?.name || "" })
                : t("common.trash_delete_desc_db", { name: activeItemToDelete?.name || "" })}
            </DialogDescription>
          </DialogHeader>
          {deletePath && (
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] font-mono text-muted-foreground break-all">
              <span className="text-foreground font-semibold">{t("common.trash_target_path")} </span>
              {deletePath}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseDelete}
              disabled={isProcessing}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isProcessing}
              className="cursor-pointer"
            >
              {isProcessing ? t("common.loading") : t("common.trash_confirm_delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Empty Whole Trash */}
      <Dialog open={showEmptyConfirm} onOpenChange={(open) => !open && onCloseEmptyConfirm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>{t("common.trash_empty_title")}</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-2">
              {t("common.trash_empty_desc", { count: totalStats })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseEmptyConfirm}
              disabled={isProcessing}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmEmptyTrash}
              disabled={isProcessing}
              className="cursor-pointer"
            >
              {isProcessing ? t("common.loading") : t("common.trash_confirm_empty")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
