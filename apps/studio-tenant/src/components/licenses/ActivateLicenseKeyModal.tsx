import * as React from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
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

interface ActivateLicenseKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: (licenseKey: string) => Promise<unknown>;
  isActivating: boolean;
}

export function ActivateLicenseKeyModal({
  open,
  onOpenChange,
  onActivate,
  isActivating,
}: ActivateLicenseKeyModalProps) {
  const { t } = useTranslation();
  const [licenseKey, setLicenseKey] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setLicenseKey("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = licenseKey.trim();
    if (!trimmed) {
      setError(t("license.tenant.err_license_key_required"));
      return;
    }
    try {
      setError(null);
      await onActivate(trimmed);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("license.tenant.activation_failed");
      setError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-foreground">
              <KeyRound className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              {t("license.tenant.activate_license_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("license.tenant.activate_license_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t("license.tenant.enter_license_key_label")}
              </label>
              <textarea
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  if (error) setError(null);
                }}
                rows={3}
                placeholder="AAAA-BBBB-CCCC-DDDD..."
                className="w-full rounded-md border border-border/80 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-hidden resize-none"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                {t("license.tenant.activate_key_hint")}
              </p>
            </div>

            {error && (
              <div className="rounded-md border border-border/80 bg-muted/30 p-2.5 text-xs text-foreground font-mono">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isActivating}
              className="h-7 px-2.5 text-xs font-medium rounded-md border-border/80"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isActivating || !licenseKey.trim()}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("license.tenant.activating")}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{t("license.tenant.verify_activate_cta")}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
