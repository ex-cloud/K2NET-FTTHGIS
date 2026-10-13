import * as React from "react";
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
import { useTranslation } from "@k2net/i18n";
import {
  Package,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Calendar,
  Edit,
} from "lucide-react";
import type { PlatformPackageItem } from "@/hooks/usePlatformPackages";

export interface PackageDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageItem: PlatformPackageItem | null;
  onEdit?: (pkg: PlatformPackageItem) => void;
}

export function PackageDetailModal({
  open,
  onOpenChange,
  packageItem,
  onEdit,
}: PackageDetailModalProps) {
  const { t } = useTranslation();

  if (!packageItem) return null;

  const hasQuotaDelta =
    Boolean(packageItem.quotaDeltaOlt && packageItem.quotaDeltaOlt > 0) ||
    Boolean(packageItem.quotaDeltaOdp && packageItem.quotaDeltaOdp > 0);

  const formatPrice = (price: number, billingType: string): string => {
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border shadow-xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {t(`packages.category.${packageItem.category}`)}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono uppercase font-bold ${
                packageItem.published
                  ? "bg-foreground/10 text-foreground border-foreground/20"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              {packageItem.published ? t("packages.status.PUBLISHED") : t("packages.status.DRAFT")}
            </Badge>
          </div>

          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 pt-1">
            <Package className="size-4 text-primary shrink-0" />
            <span>{packageItem.packageName}</span>
          </DialogTitle>

          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {packageItem.packageCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Detailed Description */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider">
              {t("packages.detail_modal.tab_overview")}
            </span>
            <p className="text-muted-foreground leading-relaxed p-3 rounded-md bg-muted/20 border border-border/60">
              {packageItem.description || "—"}
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
                {t(`packages.billing_type.${packageItem.billingType}`)}
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                {t("packages.detail_modal.field_price")}
              </span>
              <p className="font-bold font-mono text-foreground">
                {formatPrice(packageItem.priceIdr, packageItem.billingType)}
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-muted/20 border border-border/60 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                {t("packages.detail_modal.field_min_tier")}
              </span>
              <p className="font-semibold font-mono text-primary uppercase">
                {packageItem.minimumTier || "FREE"}
              </p>
            </div>
          </div>

          {/* Quota Boosters */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-foreground/80 uppercase font-mono tracking-wider flex items-center gap-1">
              <Zap className="size-3.5 text-primary" />
              {t("packages.detail_modal.quota_title")}
            </span>
            {hasQuotaDelta ? (
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-md bg-muted/30 border border-border/80 text-xs font-mono">
                {Boolean(packageItem.quotaDeltaOlt && packageItem.quotaDeltaOlt > 0) && (
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
                    {t("packages.marketplace.quota_boost_olt_only", { olt: packageItem.quotaDeltaOlt ?? 0 })}
                  </span>
                )}
                {Boolean(packageItem.quotaDeltaOdp && packageItem.quotaDeltaOdp > 0) && (
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
                    {t("packages.marketplace.quota_boost_odp_only", { odp: packageItem.quotaDeltaOdp ?? 0 })}
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
                {packageItem.prerequisiteCodes && packageItem.prerequisiteCodes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {packageItem.prerequisiteCodes.map((code) => (
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
                {packageItem.conflictCodes && packageItem.conflictCodes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {packageItem.conflictCodes.map((code) => (
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

          {onEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(packageItem);
              }}
              className="h-7 px-3 text-xs font-medium gap-1.5"
            >
              <Edit className="size-3" />
              <span>{t("packages.btn_edit")}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
