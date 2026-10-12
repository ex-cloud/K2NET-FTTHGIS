import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Clock, ShieldAlert, ArrowRight, Lock, X } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTenantLicense } from "../../hooks/useTenantLicense";

const DISMISS_SESSION_KEY = "k2net_dismiss_expiring_license_banner";

export function TenantLicenseAlertBanner() {
  const { t } = useTranslation();
  const { license } = useTenantLicense();

  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_SESSION_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleDismiss = React.useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_SESSION_KEY, "true");
    } catch {
      // Safe fallback if sessionStorage is inaccessible
    }
  }, []);

  if (!license) return null;

  const isLockedOrSuspended =
    license.status === "RESTRICTED_READ_ONLY" ||
    license.status === "SUSPENDED" ||
    license.status === "REVOKED" ||
    license.status === "EXPIRED" ||
    (license.status === "ACTIVE" && license.daysRemaining <= 0);

  const isGrace = license.status === "GRACE_PERIOD";
  const isExpiringSoon = license.status === "ACTIVE" && license.daysRemaining <= 7 && license.daysRemaining > 0;

  // Level 3: Kritis Merah - Read-Only / Suspended / Revoked (Non-dismissible)
  if (isLockedOrSuspended) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-md bg-destructive/20 text-destructive shrink-0">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-destructive">
                {t("license.banner.locked_title")}
              </span>
              <span className="text-muted-foreground">
                {t("license.banner.locked_desc")}
              </span>
            </div>
          </div>

          <Link to="/billing/invoices">
            <Button
              size="xs"
              variant="destructive"
              className="h-6 px-2.5 text-[11px] font-medium gap-1 rounded-md shadow-xs cursor-pointer"
            >
              <span>{t("license.banner.view_invoices_btn")}</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Level 2: Peringatan Amber - Grace Period (Non-dismissible)
  if (isGrace) {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-500 shrink-0">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground">
                {t("license.banner.grace_title")}
              </span>
              <span className="text-muted-foreground">
                {t("license.banner.grace_desc", { days: license.graceDaysRemaining })}
              </span>
            </div>
          </div>

          <Link to="/billing/invoices">
            <Button
              size="xs"
              variant="default"
              className="h-6 px-2.5 text-[11px] font-medium gap-1 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
            >
              <span>{t("license.banner.pay_invoice_btn")}</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Level 1: Warning Kuning - Sisa Aktif <= 7 Hari (Dismissible for session)
  if (isExpiringSoon && !dismissed) {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-500 shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground">
                {t("license.banner.expiring_title")}
              </span>
              <span className="text-muted-foreground">
                {t("license.banner.expiring_desc", { days: license.daysRemaining })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <Link to="/billing/license">
              <Button
                size="xs"
                variant="default"
                className="h-6 px-2.5 text-[11px] font-medium gap-1 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
              >
                <span>{t("license.banner.renew_btn")}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              title={t("license.banner.dismiss")}
              aria-label={t("license.banner.dismiss")}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
