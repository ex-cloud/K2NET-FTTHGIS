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
import { FlaskConical, CheckCircle2 } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";
import type {
  PlatformPackageItem,
  GrantPackagePayload,
} from "@/hooks/usePlatformPackages";

export interface GrantPackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPackage?: PlatformPackageItem | null;
  packages: PlatformPackageItem[];
  onGrant: (payload: GrantPackagePayload) => Promise<void>;
}

export function GrantPackageModal({
  open,
  onOpenChange,
  initialPackage,
  packages,
  onGrant,
}: GrantPackageModalProps) {
  const { t } = useTranslation();
  const { organizations = [] } = useOrganizations();

  const [selectedOrgId, setSelectedOrgId] = React.useState<string>("");
  const [selectedPackageCode, setSelectedPackageCode] = React.useState<string>("");
  const [durationDays, setDurationDays] = React.useState<number>(14);
  const [notes, setNotes] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (initialPackage) {
        setSelectedPackageCode(initialPackage.packageCode);
      } else if (packages.length > 0) {
        setSelectedPackageCode(packages[0].packageCode);
      }
      if (organizations.length > 0) {
        const activeOrg = organizations.find((o) => o.id);
        if (activeOrg?.id) setSelectedOrgId(activeOrg.id);
      }
    }
  }, [initialPackage, packages, organizations, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !selectedPackageCode) return;

    setSubmitting(true);
    try {
      await onGrant({
        organizationId: selectedOrgId,
        packageCode: selectedPackageCode,
        durationDays,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to grant package", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
              <FlaskConical className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {t("packages.grant_modal.title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("packages.grant_modal.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2 text-xs">
          {/* Organization Select */}
          <div>
            <label className="block font-semibold mb-1 text-foreground">
              {t("packages.grant_modal.org_select_label")}
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              required
              className="w-full h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="" disabled>
                {t("packages.grant_modal.org_select_placeholder")}
              </option>
              {organizations.map((org) => (
                <option key={org.id || org.slug} value={org.id || org.slug}>
                  {org.name} ({org.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Package Select */}
          <div>
            <label className="block font-semibold mb-1 text-foreground">
              {t("packages.grant_modal.package_select_label")}
            </label>
            <select
              value={selectedPackageCode}
              onChange={(e) => setSelectedPackageCode(e.target.value)}
              required
              className="w-full h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              {packages.map((pkg) => (
                <option key={pkg.packageCode} value={pkg.packageCode}>
                  [{pkg.packageCode}] {pkg.packageName}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Options */}
          <div>
            <label className="block font-semibold mb-1 text-foreground">
              {t("packages.grant_modal.duration_label")}
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value={7}>{t("packages.grant_modal.duration_7d")}</option>
              <option value={14}>{t("packages.grant_modal.duration_14d")}</option>
              <option value={30}>{t("packages.grant_modal.duration_30d")}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold mb-1 text-foreground">
              {t("packages.grant_modal.notes_label")}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("packages.grant_modal.notes_placeholder")}
              className="w-full rounded-md border border-border bg-muted/20 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 px-3 text-xs"
            >
              {t("packages.edit_modal.cancel_btn")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !selectedOrgId || !selectedPackageCode}
              className="h-7 px-3 text-xs font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("packages.grant_modal.btn_submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
