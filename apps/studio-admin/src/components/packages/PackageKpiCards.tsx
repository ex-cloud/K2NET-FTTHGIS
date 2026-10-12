import * as React from "react";
import { Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Boxes,
  CheckCircle,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import type { PackageKpiOverview, PlatformPackageItem } from "@/hooks/usePlatformPackages";

export interface PackageKpiCardsProps {
  overview?: PackageKpiOverview;
  packages?: PlatformPackageItem[];
  loading?: boolean;
}

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function PackageKpiCards({
  overview,
  packages = [],
  loading = false,
}: PackageKpiCardsProps) {
  const { t } = useTranslation();

  const totalPackages = overview?.totalPackages ?? packages.length;
  const publishedPackages =
    overview?.publishedPackages ?? packages.filter((p) => p.published).length;
  const draftPackages =
    overview?.draftPackages ?? packages.filter((p) => !p.published).length;
  const activeSubs = overview?.activeSubscriptions ?? 0;
  const estimatedMrr = overview?.estimatedMonthlyAddonRevenue ?? 0;

  const publishedPct =
    totalPackages > 0 ? Math.round((publishedPackages / totalPackages) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Total Packages */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("packages.kpi.total_packages")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Boxes className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {loading ? "..." : totalPackages}
            </p>
            <span className="text-xs font-mono text-muted-foreground">
              {draftPackages} {t("packages.status.DRAFT").toLowerCase()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {publishedPackages} {t("packages.status.PUBLISHED").toLowerCase()}
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>{t("packages.kpi.categories_count")}</span>
            <span>12</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Card>

      {/* 2. Live in Marketplace */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("packages.kpi.published_packages")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-foreground/10 border border-foreground/20 flex items-center justify-center text-foreground">
            <CheckCircle className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {loading ? "..." : publishedPackages}
            </p>
            <span className="text-xs font-mono text-foreground font-semibold">
              {publishedPct}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("packages.status.PUBLISHED")}
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>{t("packages.status.PUBLISHED")}</span>
            <span>{publishedPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-700"
              style={{ width: `${publishedPct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 3. Active Tenant Subscriptions */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("packages.kpi.active_subscriptions")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
            <FolderKanban className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {loading ? "..." : activeSubs}
            </p>
            <span className="text-xs font-mono text-muted-foreground">
              {t("packages.sub_status.ACTIVE")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("packages.kpi.tenants_engaged")}
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>{t("packages.sub_status.ACTIVE")}</span>
            <span>{activeSubs}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-700"
              style={{ width: activeSubs > 0 ? "100%" : "0%" }}
            />
          </div>
        </div>
      </Card>

      {/* 4. Estimated Add-on MRR */}
      <Card glowingEffect className="p-5 flex flex-col justify-between gap-3 bg-card border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
            {t("packages.kpi.estimated_mrr")}
          </span>
          <div className="h-6 w-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-bold tracking-tight text-foreground font-mono truncate">
              {loading ? "..." : formatIdr(estimatedMrr)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("packages.card.per_month")}
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>{t("packages.title")}</span>
            <span className="text-foreground font-medium">{t("packages.kpi.estimated_mrr")}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-700"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
