

import { Building2, UploadCloud, Network, AlertTriangle } from "lucide-react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { KpiMiniBarChart } from "@/components/common/KpiMiniBarChart";
import type { EnrichedOrganization } from "./types";

interface OrganizationKpiStripProps {
  organizations: EnrichedOrganization[];
  compactView?: boolean;
}

export function OrganizationKpiStrip({
  organizations,
  compactView = false,
}: OrganizationKpiStripProps) {
  const { t } = useTranslation();
  if (compactView) return null;

  const total = organizations.length;
  const activeCount = organizations.filter((o) => o.status === "ACTIVE").length;
  const provisioningCount = organizations.filter((o) => o.status === "PROVISIONING").length;
  const trialCount = organizations.filter((o) => o.status === "TRIAL").length;
  const atRiskCount = organizations.filter(
    (o) => o.status === "SUSPENDED" || o.status === "OVERDUE" || o.status === "TRIAL_EXPIRED"
  ).length;

  const totalOlts = organizations.reduce((acc, o) => acc + (o.usedOlts || 0), 0);
  const maxOlts = organizations.reduce((acc, o) => acc + (o.maxOlts || 5), 0);
  const totalOdps = organizations.reduce((acc, o) => acc + (o.usedOdps || 0), 0);

  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  const oltPct = maxOlts > 0 ? Math.min(100, Math.round((totalOlts / maxOlts) * 100)) : 0;
  const atRiskPct = total > 0 ? Math.round((atRiskCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. ACTIVE TENANTS */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("organizations.kpi_active_tenants")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-foreground">
            <Building2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {activeCount}
            </p>
            <span className="text-xs font-mono text-muted-foreground">
              {t("organizations.kpi_active_ratio", { pct: activePct })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("organizations.kpi_live_desc", { active: activeCount, total })}
          </p>
        </div>
        <KpiMiniBarChart
          label={t("organizations.kpi_tenant_activity")}
          meta={t("organizations.kpi_live_count", { count: activeCount })}
          count={activeCount}
          variant="active"
          color="primary"
        />
      </Card>

      {/* 2. PROVISIONING QUEUE */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("organizations.kpi_prov_trial")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-foreground">
            <UploadCloud className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {provisioningCount + trialCount}
            </p>
            <span className="text-xs font-mono text-foreground/80 font-medium">
              {provisioningCount > 0 ? t("organizations.kpi_in_setup") : t("organizations.kpi_on_trial")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("organizations.kpi_prov_trial_desc", { prov: provisioningCount, trial: trialCount })}
          </p>
        </div>
        <KpiMiniBarChart
          label={t("organizations.kpi_onboarding_pipeline")}
          meta={t("organizations.kpi_in_pipeline", { count: provisioningCount + trialCount })}
          count={provisioningCount + trialCount}
          variant="active"
          color="primary"
        />
      </Card>

      {/* 3. HARDWARE DEPLOYED */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("organizations.kpi_ftth_hardware")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-foreground">
            <Network className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {totalOlts} <span className="text-xs font-normal text-muted-foreground">OLTs</span>
            </p>
            <span className="text-xs font-mono text-muted-foreground">
              {totalOdps} ODPs
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("organizations.kpi_hardware_desc", { pct: oltPct })}
          </p>
        </div>
        <KpiMiniBarChart
          label={t("organizations.kpi_hardware_telemetry")}
          meta={`${totalOlts} OLTs • ${totalOdps} ODPs`}
          count={totalOlts + totalOdps}
          variant="active"
          color="primary"
        />
      </Card>

      {/* 4. AT RISK / SUSPENDED */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("organizations.kpi_overdue_inactive")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {atRiskCount}
            </p>
            <span className="text-xs font-mono text-destructive">
              {atRiskPct > 0 ? `${atRiskPct}%` : t("organizations.kpi_healthy")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {atRiskCount === 0
              ? t("organizations.kpi_all_healthy_desc")
              : t("organizations.kpi_at_risk_desc", { count: atRiskCount })}
          </p>
        </div>
        <KpiMiniBarChart
          label={t("organizations.kpi_account_health")}
          meta={
            atRiskCount > 0
              ? t("organizations.kpi_need_attention", { count: atRiskCount })
              : t("organizations.kpi_healthy")
          }
          count={atRiskCount}
          variant="urgent"
          color={atRiskCount > 0 ? "destructive" : "primary"}
        />
      </Card>
    </div>
  );
}
