import * as React from "react";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import { Card, Button, Badge, cn } from "@k2net/ui";
import {
  Zap,
  Activity,
  Sparkles,
  Shield,
  MapPin,
  Layers,
  ArrowUpRight,
  ShoppingCart,
  Lock,
  Check,
  Server,
  Boxes,
  RefreshCw,
  HardDrive,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  TenantMarketplacePackage,
  PackageCategory,
} from "../../hooks/useTenantPackagesMarketplace";

export interface MarketplaceCardGridProps {
  packages: TenantMarketplacePackage[];
  onSelectPackageForOrder: (pkg: TenantMarketplacePackage) => void;
  onUpgradePlan: () => void;
  loading?: boolean;
}

const CATEGORY_ICONS: Record<PackageCategory, LucideIcon> = {
  CAPACITY_BOOSTER: Zap,
  TELEMETRY: Activity,
  FIELD_OPS: Users,
  AI_COPILOT: Sparkles,
  GIS_ANALYTICS: MapPin,
  SECURITY_GOV: Shield,
  DISASTER_RECOVERY: RefreshCw,
  BILLING_FINANCE: HardDrive,
  INTEGRATION: Layers,
  CIVIL_INFRA: Server,
  WORKFORCE_SAFETY: Shield,
  COLLABORATION: Boxes,
};

function formatPrice(
  price: number,
  billingType: string,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  const safePrice = Number.isFinite(price) ? price : 0;
  if (safePrice === 0) return t("packages.card.price_free");
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(safePrice);

  if (billingType === "ONE_TIME") return t("packages.card.price_one_time", { price: formatted });
  if (billingType === "ANNUAL_RECURRING") return t("packages.card.price_per_year", { price: formatted });
  return t("packages.card.price_per_month", { price: formatted });
}

function parseQuotaDelta(jsonStr?: string): { olt: number; odp: number; storageGb?: number } | null {
  if (!jsonStr) return null;
  try {
    const parsed = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    const olt = Number(parsed.deltaOlts || parsed.olt || parsed.extraOlts || 0);
    const odp = Number(parsed.deltaOdps || parsed.odp || parsed.extraOdps || 0);
    const storageGb = Number(parsed.deltaStorageGb || parsed.storage || 0);
    if (olt > 0 || odp > 0 || storageGb > 0) return { olt, odp, storageGb };
  } catch {
    // ignore
  }
  return null;
}

function parseDescription(pkg: TenantMarketplacePackage, fallback: string): string {
  if (pkg.metadataJson) {
    try {
      const meta = JSON.parse(pkg.metadataJson);
      if (meta.description) return String(meta.description);
    } catch {
      // ignore
    }
  }
  return fallback;
}

interface CardHeaderBadgesProps {
  badgeLabel?: string;
  isAlreadyActive: boolean;
  isPrereqRequired: boolean;
  isLockedTier: boolean;
}

function CardHeaderBadges({
  badgeLabel,
  isAlreadyActive,
  isPrereqRequired,
  isLockedTier,
}: CardHeaderBadgesProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      {badgeLabel && (
        <Badge variant="outline" className="text-[10px] font-semibold border-primary/40 text-primary bg-primary/5 py-0 px-1.5">
          {badgeLabel}
        </Badge>
      )}
      {isAlreadyActive && (
        <Badge variant="outline" className="text-[10px] font-medium border-primary/40 text-primary bg-primary/10 py-0 px-1.5">
          <Check className="size-3 mr-1" />
          {t("packages.marketplace.state_already_active")}
        </Badge>
      )}
      {isPrereqRequired && (
        <Badge variant="outline" className="text-[10px] font-medium border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 py-0 px-1.5">
          {t("packages.marketplace.state_prereq_required")}
        </Badge>
      )}
      {isLockedTier && (
        <Badge variant="outline" className="text-[10px] font-medium border-border/80 text-muted-foreground bg-muted/30 py-0 px-1.5">
          <Lock className="size-2.5 mr-1" />
          {t("packages.marketplace.state_upgrade_required")}
        </Badge>
      )}
    </div>
  );
}

interface CardFooterActionsProps {
  isReady: boolean;
  isPrereqRequired: boolean;
  isLockedTier: boolean;
  isAlreadyActive: boolean;
  onSelect: () => void;
  onUpgrade: () => void;
}

function CardFooterActions({
  isReady,
  isPrereqRequired,
  isLockedTier,
  isAlreadyActive,
  onSelect,
  onUpgrade,
}: CardFooterActionsProps) {
  const { t } = useTranslation();

  if (isReady) {
    return (
      <Button
        size="sm"
        variant="default"
        className="w-full h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
        onClick={onSelect}
      >
        <ShoppingCart className="size-3.5" />
        <span>{t("packages.marketplace.btn_subscribe")}</span>
      </Button>
    );
  }

  if (isPrereqRequired) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
        onClick={onSelect}
      >
        <Layers className="size-3.5" />
        <span>{t("packages.marketplace.btn_bundle_subscribe")}</span>
      </Button>
    );
  }

  if (isLockedTier) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-full h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
        onClick={onUpgrade}
      >
        <ArrowUpRight className="size-3.5" />
        <span>{t("packages.marketplace.btn_upgrade_plan")}</span>
      </Button>
    );
  }

  if (isAlreadyActive) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="w-full h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md opacity-90 cursor-default"
      >
        <Check className="size-3.5 text-primary" />
        <span>{t("packages.marketplace.state_already_active")}</span>
      </Button>
    );
  }

  return null;
}

interface MarketplacePackageCardProps {
  pkg: TenantMarketplacePackage;
  onSelectPackageForOrder: (pkg: TenantMarketplacePackage) => void;
  onUpgradePlan: () => void;
}

function MarketplacePackageCard({
  pkg,
  onSelectPackageForOrder,
  onUpgradePlan,
}: MarketplacePackageCardProps) {
  const { t } = useTranslation();
  const IconComponent = CATEGORY_ICONS[pkg.category] || Layers;
  const quotaDelta = parseQuotaDelta(pkg.quotaDeltaJson);
  const description = parseDescription(pkg, t(`packages.category.${pkg.category}` as TranslationKey));
  const eligibility = pkg.eligibility;
  const state = eligibility?.eligibilityState || (pkg.isSubscribed ? "ALREADY_ACTIVE" : "READY");
  const isAlreadyActive = Boolean(pkg.isSubscribed || state === "ALREADY_ACTIVE");
  const isLockedTier = Boolean(state === "PLAN_UPGRADE_REQUIRED" || state === "LICENSE_UNHEALTHY");
  const isPrereqRequired = Boolean(state === "PREREQUISITE_REQUIRED");
  const isReady = Boolean(state === "READY" && !isAlreadyActive);

  return (
    <Card
      className={cn(
        "relative flex flex-col justify-between p-5 rounded-lg border transition-all duration-200",
        isLockedTier
          ? "bg-card/60 border-border/60 opacity-80"
          : isAlreadyActive
          ? "bg-card border-primary/40 shadow-2xs"
          : "bg-card border-border/80 hover:border-primary/50 hover:shadow-2xs"
      )}
    >
      <div>
        {/* Header Icon + Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className={cn(
              "size-9 rounded-md flex items-center justify-center shrink-0 border",
              isLockedTier
                ? "bg-muted/40 text-muted-foreground border-border/60"
                : isAlreadyActive
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-primary/5 text-primary border-primary/20"
            )}
          >
            <IconComponent className="size-4" />
          </div>

          <CardHeaderBadges
            badgeLabel={pkg.badgeLabel}
            isAlreadyActive={isAlreadyActive}
            isPrereqRequired={isPrereqRequired}
            isLockedTier={isLockedTier}
          />
        </div>

        {/* Title & Code */}
        <div className="space-y-1 mb-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground tracking-tight line-clamp-1">
              {pkg.name}
            </h3>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {pkg.code}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed mb-4">
          {description}
        </p>

        {/* Quota Boost Badge */}
        {quotaDelta && (
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 border border-border/70 text-[11px] font-mono text-foreground/90">
              <Zap className="size-3 text-primary shrink-0" />
              <span>
                {quotaDelta.storageGb && quotaDelta.storageGb > 0
                  ? t("packages.marketplace.quota_boost_storage", { storage: quotaDelta.storageGb })
                  : quotaDelta.olt > 0 && quotaDelta.odp > 0
                  ? t("packages.marketplace.quota_boost_summary", { olt: quotaDelta.olt, odp: quotaDelta.odp })
                  : quotaDelta.olt > 0
                  ? t("packages.marketplace.quota_boost_olt_only", { olt: quotaDelta.olt })
                  : t("packages.marketplace.quota_boost_odp_only", { odp: quotaDelta.odp })}
              </span>
            </div>
          </div>
        )}

        {/* Missing Prerequisite Warning Box (Condition B) */}
        {isPrereqRequired && eligibility?.missingPrerequisites && eligibility.missingPrerequisites.length > 0 && (
          <div className="mb-4 p-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <Layers className="size-3 text-amber-500 shrink-0" />
              <span>{t("packages.rules.th_prerequisites")}:</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {eligibility.missingPrerequisites.map((reqCode) => (
                <span
                  key={reqCode}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                >
                  {reqCode}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Minimum Plan Tier requirement (Condition C) */}
        {isLockedTier && (
          <div className="mb-4 p-2 rounded-md border border-border/70 bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
            <span className="text-[11px]">{t("packages.card.min_tier")}:</span>
            <span className="font-semibold text-foreground text-[11px] uppercase">
              {pkg.minPlanTier || eligibility?.minRequiredPlan || "ENTERPRISE"}
            </span>
          </div>
        )}
      </div>

      {/* Price & Action Footer */}
      <div className="pt-3 border-t border-border/70 mt-2 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-foreground font-mono">
            {formatPrice(pkg.priceMonthly, pkg.billingType, t)}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {t(`packages.billing_type.${pkg.billingType}` as TranslationKey)}
          </span>
        </div>

        <CardFooterActions
          isReady={isReady}
          isPrereqRequired={isPrereqRequired}
          isLockedTier={isLockedTier}
          isAlreadyActive={isAlreadyActive}
          onSelect={() => onSelectPackageForOrder(pkg)}
          onUpgrade={onUpgradePlan}
        />
      </div>
    </Card>
  );
}

export function MarketplaceCardGrid({
  packages,
  onSelectPackageForOrder,
  onUpgradePlan,
  loading = false,
}: MarketplaceCardGridProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border/60 bg-card p-5 animate-pulse space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-md bg-muted/60" />
              <div className="h-5 w-20 rounded bg-muted/60" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
            </div>
            <div className="h-8 w-1/2 rounded bg-muted/50" />
            <div className="h-7 w-full rounded bg-muted/60" />
          </div>
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-card/40 p-12 text-center">
        <Layers className="size-10 mx-auto text-muted-foreground/60 mb-3" />
        <p className="text-sm font-medium text-foreground">{t("packages.marketplace.empty_catalog")}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          {t("packages.marketplace.catalog_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packages.map((pkg) => (
        <MarketplacePackageCard
          key={pkg.id}
          pkg={pkg}
          onSelectPackageForOrder={onSelectPackageForOrder}
          onUpgradePlan={onUpgradePlan}
        />
      ))}
    </div>
  );
}
