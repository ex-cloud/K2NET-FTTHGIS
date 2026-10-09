import * as React from "react";
import { MetricCard } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  KeyRound,
  CheckCircle,
  Clock,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import type { LicenseOverviewKpi } from "@/hooks/useOrganizationLicenses";

interface LicenseKpiCardsProps {
  overview?: LicenseOverviewKpi;
  loading?: boolean;
}

export function LicenseKpiCards({ overview, loading }: LicenseKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard
        label={t("license.kpi.total_licenses")}
        value={overview?.totalLicenses ?? 0}
        icon={KeyRound}
        variant="groove"
        loading={loading}
      />
      <MetricCard
        label={t("license.kpi.active_licenses")}
        value={overview?.activeLicenses ?? 0}
        icon={CheckCircle}
        variant="groove"
        loading={loading}
      />
      <MetricCard
        label={t("license.kpi.grace_period")}
        value={overview?.gracePeriodLicenses ?? 0}
        icon={Clock}
        variant="groove"
        loading={loading}
      />
      <MetricCard
        label={t("license.kpi.read_only")}
        value={
          (overview?.readOnlyLicenses ?? 0) +
          (overview?.suspendedLicenses ?? 0)
        }
        icon={ShieldAlert}
        variant="groove"
        loading={loading}
      />
      <MetricCard
        label={t("license.kpi.expiring_30d")}
        value={overview?.expiringIn30Days ?? 0}
        icon={AlertTriangle}
        variant="groove"
        loading={loading}
      />
    </div>
  );
}
