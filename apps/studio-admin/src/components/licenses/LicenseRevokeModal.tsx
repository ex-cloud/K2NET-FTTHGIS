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
import { ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import {
  useRevokeLicense,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";

interface LicenseRevokeModalProps {
  license: LicenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LicenseRevokeModal({
  license,
  open,
  onOpenChange,
  onSuccess,
}: LicenseRevokeModalProps) {
  const { t } = useTranslation();
  const revokeMutation = useRevokeLicense();
  const [reason, setReason] = React.useState<string>("");
  const [secondApprover, setSecondApprover] = React.useState<string>("");
  const [confirmPhrase, setConfirmPhrase] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setReason("");
      setSecondApprover("");
      setConfirmPhrase("");
    }
  }, [open]);

  if (!license) return null;

  const isPhraseMatched = confirmPhrase.trim().toUpperCase() === "REVOKE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error(t("license.modal.revoke_reason"));
      return;
    }
    if (!secondApprover.trim()) {
      toast.error(t("license.modal.second_approver_required"));
      return;
    }
    if (!isPhraseMatched) {
      toast.error(t("license.modal.revoke_phrase_mismatch"));
      return;
    }

    try {
      await revokeMutation.mutateAsync({
        organizationId: license.organizationId,
        licenseId: license.id,
        reason: reason.trim(),
        secondApprover: secondApprover.trim(),
      });
      toast.success(t("license.feedback.revoke_success"));
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
            <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>{t("license.modal.revoke_title")}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-mono font-bold">
                  DUAL-CONTROL
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("license.modal.revoke_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* License Details Alert */}
        <div className="rounded-md border border-destructive/30 p-3 bg-destructive/5 text-xs space-y-1.5 my-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("license.table.tenant_org")}:</span>
            <span className="font-semibold text-foreground">{license.organizationName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("license.table.license_key")}:</span>
            <span className="font-mono text-foreground font-semibold">{license.maskedLicenseKey}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-destructive font-medium">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>{t("license.modal.killswitch_warning")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 py-1 text-xs">
          {/* Reason */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              {t("license.modal.revoke_reason")}
            </Label>
            <Input
              type="text"
              placeholder={t("license.modal.revoke_reason_placeholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-xs bg-background"
              required
            />
          </div>

          {/* Two-Person Approval Gate: Second Approver */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground flex items-center justify-between">
              <span>{t("license.modal.second_approver_label")}</span>
              <span className="text-[10px] font-mono text-muted-foreground">Required Gate</span>
            </Label>
            <Input
              type="text"
              placeholder={t("license.modal.second_approver_placeholder")}
              value={secondApprover}
              onChange={(e) => setSecondApprover(e.target.value)}
              className="h-8 text-xs bg-background"
              required
            />
          </div>

          {/* Safety Confirmation Phrase */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-foreground">
              {t("license.modal.revoke_confirm_label")} (<span className="font-mono font-bold text-destructive">REVOKE</span>)
            </Label>
            <Input
              type="text"
              placeholder="REVOKE"
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
              disabled={revokeMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={
                revokeMutation.isPending ||
                !isPhraseMatched ||
                !reason.trim() ||
                !secondApprover.trim()
              }
              className="gap-1.5"
            >
              {revokeMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShieldAlert className="size-3.5" />
              )}
              <span>{t("license.actions.revoke_license")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
