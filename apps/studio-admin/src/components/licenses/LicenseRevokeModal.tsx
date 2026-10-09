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
import { AlertTriangle } from "lucide-react";
import {
  useRevokeLicense,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";

interface LicenseRevokeModalProps {
  license: LicenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LicenseRevokeModal({
  license,
  open,
  onOpenChange,
}: LicenseRevokeModalProps) {
  const { t } = useTranslation();
  const revokeMutation = useRevokeLicense();
  const [reason, setReason] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;
    if (!reason.trim()) {
      toast.error(t("license.modal.revoke_reason"));
      return;
    }

    try {
      await revokeMutation.mutateAsync({
        organizationId: license.organizationId,
        licenseId: license.id,
        reason: reason.trim(),
      });
      toast.success(t("license.feedback.revoke_success"));
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("license.feedback.error_generic");
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <DialogTitle className="text-base font-semibold text-foreground">
              {t("license.modal.revoke_title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {t("license.modal.revoke_desc")}
          </DialogDescription>
        </DialogHeader>

        {license && (
          <div className="rounded-md border border-destructive/30 p-3 bg-destructive/5 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("license.table.tenant_org")}:</span>
              <span className="font-medium text-foreground">{license.organizationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("license.table.license_key")}:</span>
              <span className="font-mono text-foreground">{license.maskedLicenseKey}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 py-2 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
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

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("license.actions.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? t("common.processing") : t("license.actions.revoke_license")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
