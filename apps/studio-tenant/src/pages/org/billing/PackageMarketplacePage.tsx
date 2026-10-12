import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { PageLayout, PageHero, Card, Button, Badge, Input, cn } from "@k2net/ui";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Search,
  Zap,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Calendar,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  useTenantPackagesMarketplace,
  type TenantMarketplacePackage,
  type TenantPackageSubscription,
} from "../../../hooks/useTenantPackagesMarketplace";
import { MarketplaceCategoryTabs } from "../../../components/marketplace/MarketplaceCategoryTabs";
import { MarketplaceCardGrid } from "../../../components/marketplace/MarketplaceCardGrid";
import { PackageCheckoutModal } from "../../../components/marketplace/PackageCheckoutModal";

export function PackageMarketplacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    catalog,
    subscriptions,
    isLoading,
    refetchAll,
    cancelAutoRenew,
    isCancelling,
  } = useTenantPackagesMarketplace();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [selectedPackageForOrder, setSelectedPackageForOrder] =
    React.useState<TenantMarketplacePackage | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  // Grouping category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    catalog.forEach((pkg) => {
      counts[pkg.category] = (counts[pkg.category] || 0) + 1;
    });
    return counts;
  }, [catalog]);

  // Filtered packages by category & search query
  const filteredPackages = React.useMemo(() => {
    return catalog.filter((pkg) => {
      if (selectedCategory && pkg.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = pkg.name.toLowerCase().includes(q);
        const matchCode = pkg.code.toLowerCase().includes(q);
        const matchCat = pkg.category.toLowerCase().includes(q);
        return matchName || matchCode || matchCat;
      }
      return true;
    });
  }, [catalog, selectedCategory, searchQuery]);

  const handleOpenOrder = (pkg: TenantMarketplacePackage) => {
    setSelectedPackageForOrder(pkg);
    setIsCheckoutOpen(true);
  };

  const handleUpgradePlan = () => {
    navigate({ to: "/billing/plans" });
  };

  const handleCancelAutoRenew = async (sub: TenantPackageSubscription) => {
    const confirmed = window.confirm(
      t("packages.marketplace.confirm_cancel_renew", {
        name: sub.packageName,
        date: sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "-",
      })
    );
    if (!confirmed) return;

    try {
      await cancelAutoRenew(sub.id);
      toast.success(
        t("packages.marketplace.toast_cancel_renew_success", { name: sub.packageName })
      );
    } catch {
      toast.error(t("packages.marketplace.toast_cancel_renew_failed"));
    }
  };

  const activeSubscriptions = React.useMemo(() => {
    return subscriptions.filter(
      (sub) => sub.status === "ACTIVE" || sub.status === "TRIAL"
    );
  }, [subscriptions]);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* 1. Page Hero */}
      <PageHero
        title={t("packages.marketplace.hero_title")}
        icon={ShoppingBag}
        subtitle={t("packages.marketplace.hero_desc")}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
            onClick={refetchAll}
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            <span>{t("packages.btn_refresh")}</span>
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md"
            onClick={handleUpgradePlan}
          >
            <Sparkles className="size-3.5" />
            <span>{t("packages.marketplace.btn_upgrade_plan")}</span>
          </Button>
        </div>
      </PageHero>

      {/* 2. Active Boosters & Subscriptions Section (If Tenant Has Active Add-ons) */}
      {activeSubscriptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <span>{t("packages.marketplace.active_boosters")}</span>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 py-0 px-1.5 font-mono">
                  {activeSubscriptions.length}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("packages.marketplace.active_boosters_desc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSubscriptions.map((sub) => (
              <Card
                key={sub.id}
                className="p-3.5 rounded-lg border border-primary/30 bg-card shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {sub.packageName}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono text-primary border-primary/20 py-0 px-1">
                        {sub.packageCode}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {t(`packages.category.${sub.category}`)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 py-0 px-1.5">
                    <CheckCircle2 className="size-2.5 mr-1" />
                    {sub.status}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>
                      {sub.expiresAt
                        ? t("packages.marketplace.expires_on", {
                            date: new Date(sub.expiresAt).toLocaleDateString(),
                          })
                        : t("packages.subscriptions.auto_renew_active")}
                    </span>
                  </div>

                  {sub.autoRenew ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancelAutoRenew(sub)}
                      disabled={isCancelling}
                    >
                      <XCircle className="size-3 mr-1" />
                      <span>{t("packages.marketplace.btn_cancel_renew")}</span>
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">
                      {t("packages.subscriptions.auto_renew_inactive")}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. Catalog Section with Toolbar & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary" />
              <span>{t("packages.marketplace.catalog_title")}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("packages.marketplace.catalog_desc")}
            </p>
          </div>

          {/* Search Input: Standard h-7.5 */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("packages.marketplace.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80 rounded-md"
            />
          </div>
        </div>

        {/* Category Pills/Tabs */}
        <MarketplaceCategoryTabs
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          totalCount={catalog.length}
        />

        {/* Product Cards Grid with 3-Layer Visual Logic */}
        <MarketplaceCardGrid
          packages={filteredPackages}
          onSelectPackageForOrder={handleOpenOrder}
          onUpgradePlan={handleUpgradePlan}
          loading={isLoading}
        />
      </div>

      {/* 4. Checkout Order Modal */}
      <PackageCheckoutModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        packageItem={selectedPackageForOrder}
        onOrderSuccess={refetchAll}
      />
    </PageLayout>
  );
}
