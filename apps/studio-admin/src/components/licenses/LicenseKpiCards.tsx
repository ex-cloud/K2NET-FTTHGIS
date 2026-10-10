import * as React from "react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  CheckCircle,
  Clock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import type { LicenseOverviewKpi, LicenseItem } from "@/hooks/useOrganizationLicenses";

export interface LicenseKpiCardsProps {
  overview?: LicenseOverviewKpi;
  licenses?: LicenseItem[];
  loading?: boolean;
}

interface ComputedLicenseMetrics {
  totalLicenses: number;
  activeCount: number;
  activePct: number;
  graceCount: number;
  expiringCount: number;
  atRiskCount: number;
  atRiskPct: number;
  revokedCount: number;
  compliancePct: number;
  mrr: number;
  enterpriseCount: number;
  proCount: number;
  starterCount: number;
  highTierRatio: number;
  offlineCount: number;
  onlineCount: number;
}

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

function calculateTiers(overview?: LicenseOverviewKpi, licenses: LicenseItem[] = []) {
  const dist = overview?.tierDistribution;
  let enterprise = 0;
  let pro = 0;
  let starter = 0;

  if (dist && Object.keys(dist).length > 0) {
    enterprise = dist.ENTERPRISE ?? dist.enterprise ?? 0;
    pro = dist.PRO ?? dist.pro ?? 0;
    starter = dist.STARTER ?? dist.starter ?? 0;
  } else {
    for (const lic of licenses) {
      const plan = lic.planName?.toUpperCase();
      if (plan === "ENTERPRISE") enterprise++;
      else if (plan === "PRO") pro++;
      else if (plan === "STARTER") starter++;
    }
  }

  return { enterprise, pro, starter };
}

function calculateOfflineOnline(licenses: LicenseItem[] = [], total: number) {
  let offline = 0;
  for (const lic of licenses) {
    const actType = lic.activationType?.toUpperCase() || "";
    if (actType.includes("OFFLINE") || Boolean(lic.machineFingerprint)) {
      offline++;
    }
  }
  const online = Math.max(0, total - offline);
  return { offline, online };
}

function calculateCounts(overview?: LicenseOverviewKpi, licenses: LicenseItem[] = []) {
  const total = overview?.totalLicenses ?? licenses.length;
  const active = overview?.activeLicenses ?? licenses.filter((l) => l.status === "ACTIVE").length;
  const grace = overview?.gracePeriodLicenses ?? licenses.filter((l) => l.status === "GRACE_PERIOD").length;

  let expiring = overview?.expiringIn30Days;
  if (typeof expiring !== "number") {
    expiring = licenses.filter(
      (l) =>
        l.status === "ACTIVE" &&
        typeof l.daysRemaining === "number" &&
        l.daysRemaining <= 30 &&
        l.daysRemaining >= 0
    ).length;
  }

  const revoked =
    overview?.suspendedLicenses ??
    licenses.filter((l) => l.status === "REVOKED" || l.status === "SUSPENDED").length;

  return { total, active, grace, expiring, revoked };
}

function computeLicenseMetrics(
  overview?: LicenseOverviewKpi,
  licenses: LicenseItem[] = []
): ComputedLicenseMetrics {
  const { total, active, grace, expiring, revoked } = calculateCounts(overview, licenses);
  const { enterprise, pro, starter } = calculateTiers(overview, licenses);
  const { offline, online } = calculateOfflineOnline(licenses, total);

  const atRiskCount = grace + expiring;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  const atRiskPct = total > 0 ? Math.min(100, Math.round((atRiskCount / total) * 100)) : 0;
  const highTierRatio = total > 0 ? Math.min(100, Math.round(((enterprise + pro) / total) * 100)) : 0;
  const validCount = Math.max(0, total - revoked);
  const compliancePct = total > 0 ? Math.round((validCount / total) * 100) : 0;
  const mrr = overview?.monthlyRecurringRevenue ?? 0;

  return {
    totalLicenses: total,
    activeCount: active,
    activePct,
    graceCount: grace,
    expiringCount: expiring,
    atRiskCount,
    atRiskPct,
    revokedCount: revoked,
    compliancePct,
    mrr,
    enterpriseCount: enterprise,
    proCount: pro,
    starterCount: starter,
    highTierRatio,
    offlineCount: offline,
    onlineCount: online,
  };
}

interface ActiveLicensesCardProps {
  totalLicenses: number;
  activeCount: number;
  activePct: number;
}

function ActiveLicensesCard({
  totalLicenses,
  activeCount,
  activePct,
}: ActiveLicensesCardProps) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
          {t("license.kpi.active_licenses")}
        </span>
        <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <CheckCircle className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {activeCount}
          </p>
          <span className="text-xs font-mono text-muted-foreground">
            {activePct}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {totalLicenses > 0
            ? t("license.kpi.active_ratio", { active: activeCount, total: totalLicenses })
            : t("license.kpi.no_licenses")}
        </p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
          <span>{t("license.kpi.utilization")}</span>
          <span>{activePct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${activePct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

interface ExpiringGraceCardProps {
  totalLicenses: number;
  graceCount: number;
  expiringCount: number;
  atRiskCount: number;
  atRiskPct: number;
}

function ExpiringGraceCard({
  totalLicenses,
  graceCount,
  expiringCount,
  atRiskCount,
  atRiskPct,
}: ExpiringGraceCardProps) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
          {t("license.kpi.expiring_grace")}
        </span>
        <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Clock className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {atRiskCount}
          </p>
          <span
            className={`text-xs font-mono font-semibold ${
              atRiskCount > 0 ? "text-amber-500" : "text-muted-foreground"
            }`}
          >
            {atRiskCount > 0 ? t("license.kpi.attention_needed") : t("license.kpi.healthy")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {totalLicenses > 0
            ? t("license.kpi.grace_expiring_desc", { grace: graceCount, expiring: expiringCount })
            : t("license.kpi.no_licenses")}
        </p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
          <span>{t("license.kpi.at_risk")}</span>
          <span>{atRiskPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              atRiskCount > 0 ? "bg-amber-500" : "bg-primary"
            }`}
            style={{ width: `${atRiskPct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

interface PlatformMrrCardProps {
  totalLicenses: number;
  mrr: number;
  enterpriseCount: number;
  proCount: number;
  starterCount: number;
  highTierRatio: number;
}

function PlatformMrrCard({
  totalLicenses,
  mrr,
  enterpriseCount,
  proCount,
  starterCount,
  highTierRatio,
}: PlatformMrrCardProps) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
          {t("license.kpi.platform_mrr")}
        </span>
        <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {formatIdr(mrr)}
          </p>
          <span className="text-xs font-mono text-muted-foreground">
            {totalLicenses > 0 ? `${highTierRatio}% Ent/Pro` : "0%"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {totalLicenses > 0
            ? t("license.kpi.tier_breakdown_desc", {
                enterprise: enterpriseCount,
                pro: proCount,
                starter: starterCount,
              })
            : t("license.kpi.no_licenses")}
        </p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
          <span>{t("license.kpi.tier_mix")}</span>
          <span>{highTierRatio}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${highTierRatio}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

interface SecurityIntegrityCardProps {
  totalLicenses: number;
  revokedCount: number;
  compliancePct: number;
  offlineCount: number;
  onlineCount: number;
}

function SecurityIntegrityCard({
  totalLicenses,
  revokedCount,
  compliancePct,
  offlineCount,
  onlineCount,
}: SecurityIntegrityCardProps) {
  const { t } = useTranslation();

  const badgeText =
    totalLicenses === 0
      ? t("license.kpi.ed25519_standard")
      : revokedCount === 0
        ? t("license.kpi.ed25519_verified")
        : t("license.kpi.revoked_count", { count: revokedCount });

  const badgeColorClass =
    totalLicenses === 0 || revokedCount > 0
      ? "text-muted-foreground"
      : "text-primary";

  return (
    <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
          {t("license.kpi.security_integrity")}
        </span>
        <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {totalLicenses > 0 ? `${compliancePct}%` : "0"}
          </p>
          <span className={`text-xs font-mono font-semibold ${badgeColorClass}`}>
            {badgeText}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {totalLicenses > 0
            ? t("license.kpi.airgap_online_desc", { airgap: offlineCount, online: onlineCount })
            : t("license.kpi.no_licenses")}
        </p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
          <span>{t("license.kpi.compliance_rate")}</span>
          <span>{compliancePct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              revokedCount > 0 ? "bg-amber-500" : "bg-primary"
            }`}
            style={{ width: `${compliancePct}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

function LicenseKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-36 rounded-xl border border-border bg-card/40 animate-pulse"
        />
      ))}
    </div>
  );
}

export function LicenseKpiCards({ overview, licenses = [], loading }: LicenseKpiCardsProps) {
  if (loading) {
    return <LicenseKpiSkeleton />;
  }

  const metrics = computeLicenseMetrics(overview, licenses);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. ACTIVE ENTERPRISE LICENSES */}
      <ActiveLicensesCard
        totalLicenses={metrics.totalLicenses}
        activeCount={metrics.activeCount}
        activePct={metrics.activePct}
      />

      {/* 2. EXPIRING & GRACE PERIOD */}
      <ExpiringGraceCard
        totalLicenses={metrics.totalLicenses}
        graceCount={metrics.graceCount}
        expiringCount={metrics.expiringCount}
        atRiskCount={metrics.atRiskCount}
        atRiskPct={metrics.atRiskPct}
      />

      {/* 3. PLATFORM MRR & PLANS */}
      <PlatformMrrCard
        totalLicenses={metrics.totalLicenses}
        mrr={metrics.mrr}
        enterpriseCount={metrics.enterpriseCount}
        proCount={metrics.proCount}
        starterCount={metrics.starterCount}
        highTierRatio={metrics.highTierRatio}
      />

      {/* 4. SECURITY & INTEGRITY (ED25519) */}
      <SecurityIntegrityCard
        totalLicenses={metrics.totalLicenses}
        revokedCount={metrics.revokedCount}
        compliancePct={metrics.compliancePct}
        offlineCount={metrics.offlineCount}
        onlineCount={metrics.onlineCount}
      />
    </div>
  );
}
