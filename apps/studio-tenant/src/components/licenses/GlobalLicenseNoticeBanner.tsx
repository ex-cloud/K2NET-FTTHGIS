import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowRight, Clock } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useTenantLicense } from "../../hooks/useTenantLicense";

export function GlobalLicenseNoticeBanner() {
  const { t } = useTranslation();
  const { license } = useTenantLicense();

  if (!license) return null;

  const isGrace = license.status === "GRACE_PERIOD";
  const isExpired = license.status === "EXPIRED" || license.daysRemaining <= 0;
  const isSuspendedOrRevoked = license.status === "SUSPENDED" || license.status === "REVOKED";

  if (!isGrace && !isExpired && !isSuspendedOrRevoked) {
    return null;
  }

  return (
    <div className="w-full bg-muted/60 border-b border-border/80 px-4 py-2 text-xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-muted text-foreground border border-border/60 shrink-0">
            {isGrace ? <Clock className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {isGrace
                ? t("license.status.grace_period")
                : isExpired
                ? t("license.status.expired")
                : t("license.status.suspended")}
            </span>
            <span className="text-muted-foreground">
              {isGrace
                ? t("license.tenant.grace_days_remaining", { count: license.graceDaysRemaining })
                : t("license.tenant.license_expired_notice")}
            </span>
          </div>
        </div>

        <Link to="/billing/license">
          <Button
            size="xs"
            variant="default"
            className="h-6 px-2.5 text-[11px] font-medium gap-1 rounded-md shadow-xs bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
          >
            <span>{t("license.tenant.activate_license_btn")}</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
