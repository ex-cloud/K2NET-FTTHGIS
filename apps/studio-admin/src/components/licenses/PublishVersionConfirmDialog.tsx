import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { ArrowUpCircle, AlertCircle, Loader2 } from "lucide-react";
import type { PlanVersion } from "@/hooks/usePlanVersions";

interface PublishVersionConfirmDialogProps {
  version: PlanVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (versionId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function PublishVersionConfirmDialog({
  version,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: PublishVersionConfirmDialogProps) {
  const { t } = useTranslation();

  if (!version) return null;

  const handleConfirm = async () => {
    await onConfirm(version.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ArrowUpCircle className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("license.plans.publish_confirm_title", { version: version.version })}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("license.plans.versions_drawer_subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3 text-xs">
          <div className="p-3 rounded-md bg-muted/40 border border-border/80 flex items-start gap-2.5">
            <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground leading-relaxed">
              {t("license.plans.publish_confirm_desc", { version: version.version })}
            </p>
          </div>

          <div className="rounded-md border border-border/60 p-3 space-y-1.5 font-mono text-[11px] bg-background">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-semibold text-foreground">{version.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Price:</span>
              <span className="font-semibold text-foreground">
                Rp {version.priceMonthly.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quota Limits:</span>
              <span className="text-foreground">
                {version.maxOlts} OLTs · {version.maxOdps ?? 0} ODPs · {version.maxStorageGb} GB
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowUpCircle className="size-3.5" />
            )}
            <span>{t("license.plans.publish_confirm_btn")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
