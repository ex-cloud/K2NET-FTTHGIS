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
import {
  useExtendLicense,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";

interface LicenseExtendModalProps {
  license: LicenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LicenseExtendModal({
  license,
  open,
  onOpenChange,
}: LicenseExtendModalProps) {
  const { t } = useTranslation();
  const extendMutation = useExtendLicense();
  const [months, setMonths] = React.useState<number>(6);
  const [notes, setNotes] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    try {
      await extendMutation.mutateAsync({
        organizationId: license.organizationId,
        licenseId: license.id,
        additionalMonths: Math.max(1, months),
        notes: notes.trim() || undefined,
      });
      toast.success(t("license.feedback.extend_success"));
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
          <DialogTitle className="text-base font-semibold text-foreground">
            {t("license.modal.extend_title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("license.modal.extend_desc")}
          </DialogDescription>
        </DialogHeader>

        {license && (
          <div className="rounded-md border border-border/70 p-3 bg-muted/15 text-xs space-y-1">
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
              {t("license.modal.additional_months")}
            </Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value, 10) || 1)}
              className="h-8 text-xs bg-background"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {t("license.modal.notes")}
            </Label>
            <Input
              type="text"
              placeholder={t("license.modal.notes_placeholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs bg-background"
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
              variant="default"
              size="sm"
              disabled={extendMutation.isPending}
            >
              {extendMutation.isPending ? t("common.processing") : t("license.actions.extend_license")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
