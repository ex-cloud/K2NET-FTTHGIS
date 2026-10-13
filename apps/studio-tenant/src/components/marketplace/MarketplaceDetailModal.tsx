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

interface ParsedQuotaDelta {
  olt?: number;
  odp?: number;
  storageGb?: number;
}

function parseModalDescription(metadataJson?: string | null): string {
  if (!metadataJson) return "";
  try {
    const meta = JSON.parse(metadataJson);
    return meta?.description ? String(meta.description) : "";
  } catch {
    return "";
  }
}

function parseModalQuotaDelta(quotaDeltaJson?: string | null): ParsedQuotaDelta | null {
  if (!quotaDeltaJson) return null;
  try {
    const q = JSON.parse(quotaDeltaJson);
    const olt = Number(q.deltaOlts || q.olt || 0);
    const odp = Number(q.deltaOdps || q.odp || 0);
    const storageGb = Number(q.deltaStorageGb || q.storage || 0);
    if (olt > 0 || odp > 0 || storageGb > 0) return { olt, odp, storageGb };
  } catch {
    // ignore
  }
  return null;
}

function ModalQuotaSection({ quotaDelta }: { quotaDelta: ParsedQuotaDelta | null }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider flex items-center gap-1">
        <Zap className="size-3.5 text-primary" />
        {t("packages.detail_modal.quota_title")}
      </span>
      {quotaDelta ? (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-md bg-muted/30 border border-border/80 text-xs font-mono">
          {Boolean(quotaDelta.olt && quotaDelta.olt > 0) && (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
              {t("packages.marketplace.quota_boost_olt_only", { olt: quotaDelta.olt ?? 0 })}
            </span>
          )}
          {Boolean(quotaDelta.odp && quotaDelta.odp > 0) && (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
              {t("packages.marketplace.quota_boost_odp_only", { odp: quotaDelta.odp ?? 0 })}
            </span>
          )}
          {Boolean(quotaDelta.storageGb && quotaDelta.storageGb > 0) && (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
              {t("packages.marketplace.quota_boost_storage", { storage: quotaDelta.storageGb ?? 0 })}
            </span>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground/80 text-[11px] p-2.5 rounded-md bg-muted/10 border border-border/40">
          {t("packages.detail_modal.quota_none")}
        </p>
      )}
    </div>
  );
}

function ModalDependenciesSection({
  prerequisiteCodes,
  conflictCodes,
}: {
  prerequisiteCodes?: string[];
  conflictCodes?: string[];
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider flex items-center gap-1">
        <Layers className="size-3.5 text-primary" />
        {t("packages.detail_modal.dependencies_title")}
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Prerequisites */}
        <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1">
          <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="size-3 text-primary" />
            {t("packages.rules.th_prerequisites")}
          </span>
          {prerequisiteCodes && prerequisiteCodes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {prerequisiteCodes.map((code) => (
                <span
                  key={code}
                  className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono text-[10px]"
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
            <ShieldAlert className="size-3 text-destructive" />
            {t("packages.rules.th_conflicts")}
          </span>
          {conflictCodes && conflictCodes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {conflictCodes.map((code) => (
                <span
                  key={code}
                  className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-mono text-[10px]"
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
  );
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

  const description = parseModalDescription(pkg.metadataJson);
  const quotaDelta = parseModalQuotaDelta(pkg.quotaDeltaJson);

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
          <ModalQuotaSection quotaDelta={quotaDelta} />

          {/* Compatibility & Dependencies */}
          <ModalDependenciesSection
            prerequisiteCodes={pkg.prerequisiteCodes}
            conflictCodes={pkg.conflictCodes}
          />
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
