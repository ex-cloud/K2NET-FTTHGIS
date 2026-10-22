import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import {
  useReinstateLicense,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";

interface LicenseReinstateModalProps {
  license: LicenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LicenseReinstateModal({
  license,
  open,
  onOpenChange,
  onSuccess,
}: LicenseReinstateModalProps) {
  const { t } = useTranslation();
  const reinstateMutation = useReinstateLicense();
  const [reason, setReason] = React.useState<string>("");
  const [confirmPhrase, setConfirmPhrase] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setReason("");
      setConfirmPhrase("");
    }
  }, [open]);

  if (!license) return null;

  const isPhraseMatched = confirmPhrase.trim().toUpperCase() === "REINSTATE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error(t("license.modal.reinstate_reason_required"));
      return;
    }
    if (!isPhraseMatched) {
      toast.error(t("license.modal.reinstate_phrase_mismatch"));
      return;
    }

    try {
      await reinstateMutation.mutateAsync({
        organizationId: license.organizationId,
        licenseId: license.id,
        reason: reason.trim(),
      });
      toast.success(t("license.feedback.reinstate_success"));
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("license.feedback.error_generic");
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("license.modal.reinstate_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("license.modal.reinstate_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-md border border-border/80 p-3 bg-muted/20 text-xs space-y-1.5 my-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("license.table.tenant_org")}:</span>
            <span className="font-semibold text-foreground">{license.organizationName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("license.table.license_key")}:</span>
            <span className="font-mono text-foreground font-semibold">{license.maskedLicenseKey}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("license.table.status")}:</span>
            <span className="font-mono uppercase text-destructive font-semibold">{license.status}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 py-1 text-xs">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              {t("license.modal.reinstate_reason_label")}
            </Label>
            <Input
              type="text"
              placeholder={t("license.modal.reinstate_reason_placeholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-xs bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              {t("license.modal.reinstate_confirm_label")} (<span className="font-mono font-bold text-primary">REINSTATE</span>)
            </Label>
            <Input
              type="text"
              placeholder="REINSTATE"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              className="h-8 text-xs font-mono uppercase bg-background"
              required
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/60 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={reinstateMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={reinstateMutation.isPending || !isPhraseMatched || !reason.trim()}
              className="gap-1.5"
            >
              {reinstateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              <span>{t("license.actions.reinstate_license")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
