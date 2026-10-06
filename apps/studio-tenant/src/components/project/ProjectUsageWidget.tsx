import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Button, Card, cn } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { type Project } from "../../hooks/useProjects";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";

interface ProjectUsageWidgetProps {
  projects: Project[];
}

function CircularMeter({ percent }: { percent: number }) {
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-4 h-4">
      <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
        {/* Background track circle with sunken dark groove feel */}
        <circle
          cx="8"
          cy="8"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-black/40 dark:text-black/70"
        />
        {/* Active progress arc */}
        <circle
          cx="8"
          cy="8"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500",
            percent >= 95
              ? "text-rose-500"
              : percent >= 80
              ? "text-amber-500"
              : percent > 0
              ? "text-primary"
              : "text-transparent"
          )}
        />
      </svg>
    </div>
  );
}

export function ProjectUsageWidget({ projects }: ProjectUsageWidgetProps) {
  const { t } = useTranslation();
  const {
    tier,
    planName,
    maxProjects,
    maxOdps,
    usedStorageGb,
    maxStorageGb,
    storagePercentage,
    isBoosterActive,
    boosterDaysRemaining,
  } = useTenantSubscription();

  const totalSubscribers = React.useMemo(
    () => projects.reduce((acc, p) => acc + (p.totalSubscribers || 0), 0),
    [projects]
  );
  const totalCableKm = React.useMemo(
    () => projects.reduce((acc, p) => acc + (p.cableLengthKm || 0), 0),
    [projects]
  );
  const totalOdc = React.useMemo(
    () => projects.reduce((acc, p) => acc + (p.odcCount || 0), 0),
    [projects]
  );
  const totalOdp = React.useMemo(
    () => projects.reduce((acc, p) => acc + (p.odpCount || 0), 0),
    [projects]
  );

  const subscriberQuota =
    tier === "enterprise"
      ? 25000
      : tier === "pro"
      ? 5000
      : tier === "starter"
      ? 500
      : 100;
  const cableQuotaKm =
    tier === "enterprise"
      ? 1500
      : tier === "pro"
      ? 300
      : tier === "starter"
      ? 50
      : 10;

  const subscriberPercent = Math.min(100, Math.round((totalSubscribers / subscriberQuota) * 100));
  const projectPercent = Math.min(100, Math.round((projects.length / Math.max(1, maxProjects)) * 100));
  const cablePercent = Math.min(100, Math.round((totalCableKm / Math.max(1, cableQuotaKm)) * 100));
  const odpPercent = Math.min(100, Math.round((totalOdp / Math.max(1, maxOdps)) * 100));

  const usageItems = [
    {
      label: t("gis.active_ftth_projects"),
      value: `${projects.length} / ${maxProjects}`,
      percent: projectPercent,
    },
    {
      label: t("gis.total_customers"),
      value: `${totalSubscribers.toLocaleString()} / ${subscriberQuota.toLocaleString()}`,
      percent: subscriberPercent,
    },
    {
      label: t("gis.fiber_cable_span"),
      value: `${totalCableKm.toFixed(1)} / ${cableQuotaKm} Km`,
      percent: cablePercent,
    },
    {
      label: t("gis.odc_odp_devices"),
      value: `${totalOdc} ODC / ${totalOdp} ODP`,
      percent: odpPercent,
    },
    {
      label: t("gis.s3_storage"),
      value: `${usedStorageGb.toFixed(1)} / ${maxStorageGb} GB`,
      percent: storagePercentage,
    },
  ];

  const planDisplayTitle =
    tier === "enterprise"
      ? t("billing.plan_enterprise_title")
      : tier === "pro"
      ? t("billing.plan_pro_title")
      : tier === "starter"
      ? t("billing.plan_starter_title")
      : t("billing.plan_trial_title");

  const upgradeCtaText =
    tier === "free"
      ? t("billing.upgrade_plan")
      : tier === "starter"
      ? t("billing.upgrade_to_pro")
      : tier === "pro"
      ? t("billing.upgrade_to_enterprise")
      : t("billing.manage_quota");

  return (
    <Card
      glowingEffect
      className="group relative flex flex-col justify-between p-5 border-border/60 bg-card transition-all duration-200"
    >
      <div className="space-y-3.5">
        {/* Header with border-groove-b */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-groove-b">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">{planDisplayTitle}</h3>
              {isBoosterActive && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {t("billing.booster_badge", { days: boosterDaysRemaining })}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("billing.cycle_quota_usage", { plan: planName })}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs font-medium rounded-lg border-border/80 hover:bg-muted/50"
          >
            <Link to="/billing">{upgradeCtaText}</Link>
          </Button>
        </div>

        {/* Usage list with border-groove-t dividers and visual progress bars */}
        <div className="space-y-2.5">
          {usageItems.map((item, idx) => {
            const isCritical = item.percent >= 95;
            const isWarning = item.percent >= 80 && item.percent < 95;

            const progressColor = isCritical
              ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.45)]"
              : isWarning
              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]"
              : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]";

            return (
              <div
                key={idx}
                className={cn(
                  "py-1.5 space-y-1.5",
                  idx > 0 && "border-groove-t pt-2.5"
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CircularMeter percent={item.percent} />
                    <span className="font-medium text-foreground/90 truncate text-[11px]">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-foreground shrink-0 ml-2 text-[11px]">
                    {item.value}
                  </span>
                </div>

                {/* Visual Capacity Mini Progress Bar with Sunken Groove Track */}
                <div className="h-1.5 w-full track-groove rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                    style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
