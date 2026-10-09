import React from "react";
import { Card, Badge, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { useRouter } from "@/lib/navigation-compat";
import {
  KeyRound,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  useLicenseOverview,
  useAllLicenses,
  type LicenseItem,
  type LicenseOverviewKpi,
} from "@/hooks/useOrganizationLicenses";

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <Badge className="border-border bg-muted/40 text-foreground font-mono text-[10px]">
        ACTIVE
      </Badge>
    );
  }
  if (status === "GRACE_PERIOD") {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[10px]">
        GRACE
      </Badge>
    );
  }
  if (status === "RESTRICTED_READ_ONLY") {
    return (
      <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-500 font-mono text-[10px]">
        LOCKED
      </Badge>
    );
  }
  return (
    <Badge className="border-border bg-muted/20 text-muted-foreground font-mono text-[10px]">
      {status}
    </Badge>
  );
}

function DaysBadge({ days }: { days: number }) {
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-rose-500">
        <AlertTriangle className="h-3 w-3" />
        {days}d
      </span>
    );
  }
  if (days <= 14) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-amber-500">
        <Clock className="h-3 w-3" />
        {days}d
      </span>
    );
  }
  return (
    <span className="font-mono text-xs text-foreground/80">
      {days}d
    </span>
  );
}

function ActiveLicensesCard({
  active,
  total,
  loading,
  label,
  subLabel,
}: {
  active: number;
  total: number;
  loading: boolean;
  label: string;
  subLabel: string;
}) {
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2 bg-card/60 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <ShieldCheck className="h-4 w-4 text-primary" />
      </div>
      <p className="text-2xl font-bold text-foreground">
        {loading ? "…" : active}
      </p>
      <p className="text-xs text-muted-foreground">
        {loading ? "…" : `${total} ${subLabel}`}
      </p>
    </Card>
  );
}

function GracePeriodCard({
  grace,
  readOnly,
  loading,
  label,
  lockedLabel,
  readOnlyLabel,
}: {
  grace: number;
  readOnly: number;
  loading: boolean;
  label: string;
  lockedLabel: string;
  readOnlyLabel: string;
}) {
  const isGrace = grace > 0;
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2 bg-card/60 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Clock className="h-4 w-4 text-amber-500" />
      </div>
      <p className={`text-2xl font-bold ${isGrace ? "text-amber-500" : "text-foreground"}`}>
        {loading ? "…" : grace}
      </p>
      <p className="text-xs text-muted-foreground">
        {readOnly > 0 ? `${readOnly} ${readOnlyLabel}` : `0 ${lockedLabel}`}
      </p>
    </Card>
  );
}

function ExpiringSoonCard({
  expiring7,
  expiring30,
  loading,
  label,
  subLabel,
}: {
  expiring7: number;
  expiring30: number;
  loading: boolean;
  label: string;
  subLabel: string;
}) {
  const isExpiring = expiring7 > 0;
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2 bg-card/60 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <AlertTriangle className={`h-4 w-4 ${isExpiring ? "text-rose-500" : "text-muted-foreground"}`} />
      </div>
      <p className={`text-2xl font-bold ${isExpiring ? "text-rose-500" : "text-foreground"}`}>
        {loading ? "…" : expiring7}
      </p>
      <p className="text-xs text-muted-foreground">
        {loading ? "…" : `${expiring30} ${subLabel}`}
      </p>
    </Card>
  );
}

function MrrCard({
  mrr,
  loading,
  label,
  subLabel,
}: {
  mrr: number;
  loading: boolean;
  label: string;
  subLabel: string;
}) {
  return (
    <Card glowingEffect className="p-5 flex flex-col gap-2 bg-card/60 backdrop-blur-sm border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      <p className="text-2xl font-bold text-foreground">
        {loading ? "…" : formatIdr(mrr)}
      </p>
      <p className="text-xs text-muted-foreground">
        {subLabel}
      </p>
    </Card>
  );
}

function LicenseKpiGrid({
  kpi,
  loading,
  t,
}: {
  kpi?: LicenseOverviewKpi;
  loading: boolean;
  t: (key: string) => string;
}) {
  const active = kpi?.activeLicenses ?? 0;
  const total = kpi?.totalLicenses ?? 0;
  const grace = kpi?.gracePeriodLicenses ?? 0;
  const readOnly = kpi?.readOnlyLicenses ?? 0;
  const expiring7 = kpi?.expiringIn7Days ?? 0;
  const expiring30 = kpi?.expiringIn30Days ?? 0;
  const mrr = kpi?.monthlyRecurringRevenue ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ActiveLicensesCard
        active={active}
        total={total}
        loading={loading}
        label={t("observability.license_active_count")}
        subLabel={t("observability.license_total_registered")}
      />
      <GracePeriodCard
        grace={grace}
        readOnly={readOnly}
        loading={loading}
        label={t("observability.license_grace_count")}
        lockedLabel={t("observability.license_soft_locked")}
        readOnlyLabel={t("observability.license_restricted_readonly")}
      />
      <ExpiringSoonCard
        expiring7={expiring7}
        expiring30={expiring30}
        loading={loading}
        label={t("observability.license_expiring_soon")}
        subLabel={t("observability.license_expiring_30d")}
      />
      <MrrCard
        mrr={mrr}
        loading={loading}
        label={t("observability.license_mrr_label")}
        subLabel={t("observability.license_active_renewals")}
      />
    </div>
  );
}

function TenantWatchlistRow({ lic }: { lic: LicenseItem }) {
  return (
    <div
      key={lic.id}
      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/15 transition-colors"
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {lic.organizationName || lic.organizationSlug}
          </span>
          <Badge className="border-border bg-muted/30 text-[10px] text-foreground/80 font-mono">
            {lic.planName}
          </Badge>
          <StatusBadge status={lic.status} />
        </div>
        <p className="text-[11px] text-muted-foreground font-mono">
          ID: {lic.organizationSlug} · Key: {lic.maskedLicenseKey}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="rounded bg-muted/30 px-1.5 py-0.5 border border-border/50">
            OLT: {lic.entitlements?.maxProjects ?? 6}
          </span>
          <span className="rounded bg-muted/30 px-1.5 py-0.5 border border-border/50">
            ODP: {lic.entitlements?.maxOdps ?? 2500}
          </span>
          <span className="rounded bg-muted/30 px-1.5 py-0.5 border border-border/50">
            S3: {lic.entitlements?.maxStorageGb ?? 100} GB
          </span>
        </div>

        <div className="text-right">
          <DaysBadge days={lic.daysRemaining} />
        </div>
      </div>
    </div>
  );
}

export function PlatformLicenseTelemetryWidget() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: kpi, isLoading: kpiLoading } = useLicenseOverview();
  const { data: allLicenses = [], isLoading: licensesLoading } = useAllLicenses();

  const urgentLicenses = React.useMemo(() => {
    return [...allLicenses]
      .filter((l) => l.status === "ACTIVE" || l.status === "GRACE_PERIOD")
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);
  }, [allLicenses]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-muted/30">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
            </span>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              {t("observability.license_telemetry_title")}
            </h2>
            <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">
              PROMETHEUS ENGINE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            {t("observability.license_telemetry_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("http://100.110.205.109:3002/d/ftth-saas-licenses-overview", "_blank")}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("observability.license_open_grafana")}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push("/licenses")}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs bg-foreground text-background"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            {t("observability.license_open_hub")}
          </Button>
        </div>
      </div>

      {/* KPI Stats - Each card is individual Card with glowingEffect & p-5 padding */}
      <LicenseKpiGrid kpi={kpi} loading={kpiLoading} t={t} />

      {/* Tenant Watchlist */}
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              {t("observability.license_watchlist_title")}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t("observability.license_watchlist_desc")}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {t("observability.license_sorted_by_expiry")}
          </span>
        </div>

        <div>
          {licensesLoading ? (
            <div className="p-5 text-center text-xs text-muted-foreground">
              Loading tenant telemetries…
            </div>
          ) : urgentLicenses.length === 0 ? (
            <div className="p-5 text-center text-xs text-muted-foreground">
              {t("observability.license_all_healthy")}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {urgentLicenses.map((lic: LicenseItem) => (
                <TenantWatchlistRow key={lic.id} lic={lic} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
