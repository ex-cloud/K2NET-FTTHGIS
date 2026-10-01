import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { useTranslation } from "@k2net/i18n";

export function TrialPausedBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    tier,
    status,
    isTrialExpired,
    graceDaysRemaining,
    gracePeriodUntil,
    trialDaysRemaining,
  } = useTenantSubscription();

  // Format cut-off date nicely using the i18n formatDate helper (Hook called unconditionally)
  const cutOffFormatted = React.useMemo(() => {
    if (!gracePeriodUntil) return null;
    try {
      const date = new Date(gracePeriodUntil);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return null;
    }
  }, [gracePeriodUntil]);

  // If not on free/trial tier or active paid tenant, do not render
  if (tier !== "free" && status !== "TRIAL" && status !== "TRIAL_EXPIRED") {
    return null;
  }

  // SCENARIO 1: Trial is Expired & Soft-Locked / Paused (Fase 2)
  if (isTrialExpired || status === "TRIAL_EXPIRED") {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 sm:py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground">
                  {t("billing.trial_expired_banner_title")}
                </span>
                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  {graceDaysRemaining > 0
                    ? t("billing.trial_grace_days", { days: graceDaysRemaining })
                    : t("billing.trial_grace_cutoff_today")}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {t("billing.trial_expired_banner_desc", {
                  cutoff: cutOffFormatted || t("billing.trial_cutoff_fallback"),
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Button
              size="sm"
              variant="default"
              onClick={() => navigate({ to: "/billing" })}
              className="h-7.5 px-3 text-xs font-semibold gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <span>{t("billing.trial_upgrade_btn")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // SCENARIO 2: Active Trial Expiring Soon (3 days or less)
  if (status === "TRIAL" && trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
    return (
      <div className="w-full bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="text-foreground">
              {t("billing.trial_active_banner", { days: trialDaysRemaining })}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/billing" })}
            className="h-6 px-2.5 text-[11px] font-medium border-blue-500/30 hover:bg-blue-500/10 text-foreground cursor-pointer self-end sm:self-auto"
          >
            {t("billing.trial_choose_plan_btn")}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
