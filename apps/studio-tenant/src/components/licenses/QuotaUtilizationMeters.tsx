import * as React from "react";
import { Server, Network, HardDrive, Activity, AlertTriangle, type LucideIcon } from "lucide-react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { TenantLicenseDetails } from "../../hooks/useTenantLicense";
import { useTenantSubscription, type SubscriptionSummary } from "../../hooks/useTenantSubscription";

interface QuotaUtilizationMetersProps {
  license: TenantLicenseDetails | null | undefined;
}

interface QuotaMetricItem {
  id: string;
  title: string;
  icon: LucideIcon;
  used: number;
  max: number;
  unit: string;
  percent: number;
}

function calcOltItem(
  license: TenantLicenseDetails | null | undefined,
  summary: SubscriptionSummary | null | undefined,
  title: string
): QuotaMetricItem {
  const max = license?.entitlements?.maxProjects ?? summary?.effectiveMaxOlts ?? summary?.maxOlts ?? 1;
  const used = summary?.usedOlts ?? summary?.usedProjects ?? 0;
  return {
    id: "olts",
    title,
    icon: Server,
    used,
    max,
    unit: "OLT",
    percent: Math.min(100, Math.round((used / Math.max(1, max)) * 100)),
  };
}

function calcOdpItem(
  license: TenantLicenseDetails | null | undefined,
  summary: SubscriptionSummary | null | undefined,
  title: string
): QuotaMetricItem {
  const max = license?.entitlements?.maxOdps ?? summary?.effectiveMaxOdps ?? summary?.maxOdps ?? 50;
  const used = summary?.usedOdps ?? 0;
  return {
    id: "odps",
    title,
    icon: Network,
    used,
    max,
    unit: "ODP",
    percent: Math.min(100, Math.round((used / Math.max(1, max)) * 100)),
  };
}

function calcStorageItem(
  license: TenantLicenseDetails | null | undefined,
  summary: SubscriptionSummary | null | undefined,
  title: string
): QuotaMetricItem {
  const max = license?.entitlements?.maxStorageGb ?? summary?.maxStorageGb ?? 2;
  const used = summary?.usedStorageGb ?? 0;
  return {
    id: "storage",
    title,
    icon: HardDrive,
    used: Number(used.toFixed(1)),
    max,
    unit: "GB",
    percent: Math.min(100, Math.round((used / Math.max(1, max)) * 100)),
  };
}

function calcApiItem(
  summary: SubscriptionSummary | null | undefined,
  title: string
): QuotaMetricItem {
  const max = summary?.apiRateLimitMax ?? 500;
  const used = summary?.apiRateLimitUsed ?? 0;
  return {
    id: "api",
    title,
    icon: Activity,
    used,
    max,
    unit: "RPM",
    percent: Math.min(100, Math.round((used / Math.max(1, max)) * 100)),
  };
}

function resolveQuotaMetrics(
  license: TenantLicenseDetails | null | undefined,
  summary: SubscriptionSummary | null | undefined,
  t: (key: string) => string
): QuotaMetricItem[] {
  return [
    calcOltItem(license, summary, t("license.tenant.quota_olts")),
    calcOdpItem(license, summary, t("license.tenant.quota_odps")),
    calcStorageItem(license, summary, t("license.tenant.quota_storage")),
    calcApiItem(summary, t("license.tenant.quota_api_rpm")),
  ];
}

function QuotaMetricCard({ item }: { item: QuotaMetricItem }) {
  const Icon = item.icon;
  const isNearLimit = item.percent >= 90;

  return (
    <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/60 text-foreground border border-border/60">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium text-foreground">
            {item.title}
          </span>
        </div>
        {isNearLimit && (
          <AlertTriangle className="h-3.5 w-3.5 text-foreground/80 shrink-0" />
        )}
      </div>

      <div className="flex items-baseline justify-between text-xs">
        <span className="font-mono text-foreground font-semibold text-sm">
          {item.used}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            / {item.max} {item.unit}
          </span>
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {item.percent}%
        </span>
      </div>

      <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden border border-border/40">
        <div
          className="bg-foreground h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </div>
  );
}

export function QuotaUtilizationMeters({ license }: QuotaUtilizationMetersProps) {
  const { t } = useTranslation();
  const { summary } = useTenantSubscription();

  const entitlements = license?.entitlements;
  const quotaItems = React.useMemo(
    () => resolveQuotaMetrics(license, summary, t as (k: string) => string),
    [license, summary, t]
  );

  return (
    <Card className="p-5 border-border/80 bg-card shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {t("license.tenant.quota_utilization_title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("license.tenant.quota_utilization_desc")}
          </p>
        </div>
        {entitlements?.calculationSource && (
          <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted/40 px-2 py-0.5 rounded border border-border/60">
            {entitlements.calculationSource}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quotaItems.map((item) => (
          <QuotaMetricCard key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}
