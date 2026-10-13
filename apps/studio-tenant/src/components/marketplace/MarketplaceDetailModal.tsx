import * as React from "react";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from "@k2net/ui";
import {
  Package,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
  ShoppingCart,
  ArrowUpRight,
  Check,
} from "lucide-react";
import type { TenantMarketplacePackage } from "../../hooks/useTenantPackagesMarketplace";

export interface MarketplaceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: TenantMarketplacePackage | null;
  onSelectForOrder?: (pkg: TenantMarketplacePackage) => void;
  onUpgradePlan?: () => void;
}

export function MarketplaceDetailModal({
  open,
  onOpenChange,
  pkg,
  onSelectForOrder,
  onUpgradePlan,
}: MarketplaceDetailModalProps) {
  const { t } = useTranslation();

  if (!pkg) return null;

  let description = "";
  if (pkg.metadataJson) {
    try {
      const meta = JSON.parse(pkg.metadataJson);
      if (meta.description) description = String(meta.description);
    } catch {
      // ignore
    }
  }

  let quotaDelta: { olt?: number; odp?: number; storageGb?: number } | null = null;
  if (pkg.quotaDeltaJson) {
    try {
      const q = JSON.parse(pkg.quotaDeltaJson);
      const olt = Number(q.deltaOlts || q.olt || 0);
      const odp = Number(q.deltaOdps || q.odp || 0);
      const storageGb = Number(q.deltaStorageGb || q.storage || 0);
      if (olt > 0 || odp > 0 || storageGb > 0) quotaDelta = { olt, odp, storageGb };
    } catch {
      // ignore
    }
  }

  const formatPrice = (price: number): string => {
    const safePrice = Number.isFinite(price) ? price : 0;
    if (safePrice === 0) return t("packages.card.price_free");
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(safePrice);
  };

  const eligibility = pkg.eligibility;
  const state = eligibility?.eligibilityState || (pkg.isSubscribed ? "ALREADY_ACTIVE" : "READY");
  const isAlreadyActive = Boolean(pkg.isSubscribed || state === "ALREADY_ACTIVE");
  const isLockedTier = Boolean(state === "PLAN_UPGRADE_REQUIRED" || state === "LICENSE_UNHEALTHY");
  const isPrereqRequired = Boolean(state === "PREREQUISITE_REQUIRED");
  const isReady = Boolean(state === "READY" && !isAlreadyActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border shadow-xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {t(`packages.category.${pkg.category}` as TranslationKey)}
            </span>
            {pkg.badgeLabel && (
              <Badge variant="outline" className="text-[10px] font-semibold border-primary/40 text-primary bg-primary/5 py-0 px-1.5">
                {pkg.badgeLabel}
              </Badge>
            )}
            {isAlreadyActive && (
              <Badge variant="outline" className="text-[10px] font-medium border-primary/40 text-primary bg-primary/10 py-0 px-1.5">
                <Check className="size-3 mr-1" />
                {t("packages.marketplace.state_already_active")}
              </Badge>
            )}
          </div>

          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 pt-1">
            <Package className="size-4 text-primary shrink-0" />
            <span>{pkg.name}</span>
          </DialogTitle>

          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {pkg.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Detailed Description */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider">
              {t("packages.detail_modal.tab_overview")}
            </span>
            <p className="text-muted-foreground leading-relaxed p-3 rounded-md bg-muted/20 border border-border/60">
              {description || "—"}
            </p>
          </div>

          {/* Pricing & Commercial Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                {t("packages.detail_modal.field_billing")}
              </span>
              <p className="font-semibold text-foreground">
                {t(`packages.billing_type.${pkg.billingType}` as TranslationKey)}
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                {t("packages.detail_modal.field_price")}
              </span>
              <p className="font-bold font-mono text-foreground">
                {formatPrice(pkg.priceMonthly)}
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                {t("packages.detail_modal.field_min_tier")}
              </span>
              <p className="font-semibold font-mono text-primary uppercase">
                {pkg.minPlanTier || "FREE"}
              </p>
            </div>
          </div>

          {/* Quota Boosters */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider flex items-center gap-1">
              <Zap className="size-3.5 text-amber-500" />
              {t("packages.detail_modal.quota_title")}
            </span>
            {quotaDelta ? (
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/20 text-xs font-mono">
                {Boolean(quotaDelta.olt && quotaDelta.olt > 0) && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                    +{quotaDelta.olt} OLT Hardware
                  </span>
                )}
                {Boolean(quotaDelta.odp && quotaDelta.odp > 0) && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                    +{quotaDelta.odp} ODP Splitters
                  </span>
                )}
                {Boolean(quotaDelta.storageGb && quotaDelta.storageGb > 0) && (
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
                    +{quotaDelta.storageGb} GB S3 Storage
                  </span>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground/80 text-[11px] p-2.5 rounded-md bg-muted/10 border border-border/40">
                {t("packages.detail_modal.quota_none")}
              </p>
            )}
          </div>

          {/* Compatibility & Dependencies */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider flex items-center gap-1">
              <Layers className="size-3.5 text-sky-500" />
              {t("packages.detail_modal.dependencies_title")}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Prerequisites */}
              <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3 text-sky-500" />
                  {t("packages.rules.th_prerequisites")}
                </span>
                {pkg.prerequisiteCodes && pkg.prerequisiteCodes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {pkg.prerequisiteCodes.map((code) => (
                      <span
                        key={code}
                        className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20 font-mono text-[10px]"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {t("packages.detail_modal.prereq_none")}
                  </p>
                )}
              </div>

              {/* Conflicts */}
              <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="size-3 text-rose-500" />
                  {t("packages.rules.th_conflicts")}
                </span>
                {pkg.conflictCodes && pkg.conflictCodes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {pkg.conflictCodes.map((code) => (
                      <span
                        key={code}
                        className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono text-[10px]"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {t("packages.detail_modal.conflicts_none")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 text-xs"
          >
            {t("packages.detail_modal.btn_close")}
          </Button>

          {isReady && onSelectForOrder && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onSelectForOrder(pkg);
              }}
              className="h-7 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <ShoppingCart className="size-3.5" />
              <span>{t("packages.marketplace.btn_subscribe")}</span>
            </Button>
          )}

          {isLockedTier && onUpgradePlan && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                onOpenChange(false);
                onUpgradePlan();
              }}
              className="h-7 px-3 text-xs font-semibold gap-1.5"
            >
              <ArrowUpRight className="size-3.5" />
              <span>{t("packages.marketplace.btn_upgrade_plan")}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
