import * as React from "react";
import { Card, Button, Input } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Search,
  SlidersHorizontal,
  Edit,
  Eye,
  EyeOff,
  FlaskConical,
  Layers,
  ShieldAlert,
  Zap,
  Info,
} from "lucide-react";
import type { PlatformPackageItem, PackageCategory } from "@/hooks/usePlatformPackages";
import { PackageDetailModal } from "./PackageDetailModal";

export interface PackageCatalogGridProps {
  packages: PlatformPackageItem[];
  loading?: boolean;
  selectedCategory?: string;
  selectedStatus?: string;
  selectedLifecycle?: string;
  onSelectCategory: (category: string) => void;
  onSelectStatus: (status: string) => void;
  onSelectLifecycle?: (lifecycle: string) => void;
  onEditPackage: (pkg: PlatformPackageItem) => void;
  onTogglePublish: (code: string, published: boolean) => void;
  onGrantPackage: (pkg: PlatformPackageItem) => void;
}

const CATEGORIES: PackageCategory[] = [
  "TELEMETRY",
  "FIELD_OPS",
  "INTEGRATION",
  "CAPACITY_BOOSTER",
  "SECURITY_GOV",
  "SPATIAL_AI",
  "WHITE_LABEL",
  "DISASTER_RECOVERY",
  "COMPLIANCE_ROW",
  "CONTRACTOR_OPS",
  "SALES_EXPANSION",
  "IOT_SENSORS",
];

export function PackageCatalogGrid({
  packages,
  loading = false,
  selectedCategory = "",
  selectedStatus = "",
  selectedLifecycle = "",
  onSelectCategory,
  onSelectStatus,
  onSelectLifecycle,
  onEditPackage,
  onTogglePublish,
  onGrantPackage,
}: PackageCatalogGridProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedForDetail, setSelectedForDetail] = React.useState<PlatformPackageItem | null>(null);

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

  const lifecycleTabs = React.useMemo(() => [
    { id: "", label: t("packages.tab_all_catalog"), count: packages.length },
    { id: "PUBLISHED", label: t("packages.tab_marketplace_ready"), count: packages.filter(p => p.lifecycleStatus === "PUBLISHED").length },
    { id: "DRAFT", label: t("packages.tab_under_development"), count: packages.filter(p => p.lifecycleStatus === "DRAFT").length },
    { id: "CORE_BUNDLED", label: t("packages.tab_core_bundled"), count: packages.filter(p => p.lifecycleStatus === "CORE_BUNDLED").length },
  ], [packages, t]);

  const filteredPackages = React.useMemo(() => {
    return packages.filter((pkg) => {
      if (selectedLifecycle && pkg.lifecycleStatus !== selectedLifecycle) return false;
      if (selectedCategory && pkg.category !== selectedCategory) return false;
      if (selectedStatus === "PUBLISHED" && !pkg.published) return false;
      if (selectedStatus === "DRAFT" && pkg.published) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = pkg.packageCode.toLowerCase().includes(query);
        const matchesName = pkg.packageName.toLowerCase().includes(query);
        const matchesDesc = (pkg.description || "").toLowerCase().includes(query);
        return matchesCode || matchesName || matchesDesc;
      }
      return true;
    });
  }, [packages, selectedLifecycle, selectedCategory, selectedStatus, searchQuery]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 5-Layer DoD Lifecycle Status Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-2.5">
        <div className="flex items-center rounded-md border border-border/80 bg-card p-0.5 shrink-0 overflow-x-auto">
          {lifecycleTabs.map((tab) => {
            const isActive = (selectedLifecycle || "") === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectLifecycle?.(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-foreground text-background shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar: Search + Category Filters + Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("packages.filter_search_placeholder")}
            className="pl-8 h-8 text-xs bg-muted/20 border-border"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="">{t("packages.filter_all_categories")}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`packages.category.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="">{t("packages.filter_all_statuses")}</option>
            <option value="PUBLISHED">{t("packages.status.PUBLISHED")}</option>
            <option value="DRAFT">{t("packages.status.DRAFT")}</option>
          </select>
        </div>
      </div>

      {/* Package Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Card key={idx} className="p-5 h-48 animate-pulse bg-muted/20 border-border" />
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        <Card className="p-8 text-center bg-card border-border flex flex-col items-center justify-center gap-2">
          <Layers className="h-8 w-8 text-muted-foreground/60 mb-1" />
          <p className="text-sm font-semibold text-foreground">
            {t("packages.fields.prerequisites_help")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("packages.filter_search_placeholder")}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => (
            <PackageCardItem
              key={pkg.id || pkg.packageCode}
              pkg={pkg}
              onEditPackage={onEditPackage}
              onTogglePublish={onTogglePublish}
              onGrantPackage={onGrantPackage}
              onSelectForDetail={(selected: PlatformPackageItem) => {
                setSelectedForDetail(selected);
                setDetailModalOpen(true);
              }}
              formatPrice={formatPrice}
              t={t}
            />
          ))}
        </div>
      )}

      {/* View Detail Modal */}
      <PackageDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        packageItem={selectedForDetail}
        onEdit={onEditPackage}
      />
    </div>
  );
}

interface PackageCardItemProps {
  pkg: PlatformPackageItem;
  onEditPackage: (pkg: PlatformPackageItem) => void;
  onTogglePublish: (idOrCode: string, publish: boolean) => void;
  onGrantPackage: (pkg: PlatformPackageItem) => void;
  onSelectForDetail: (pkg: PlatformPackageItem) => void;
  formatPrice: (price: number, billingType: string) => string;
  t: ReturnType<typeof useTranslation>["t"];
}

function LifecycleBadge({
  status,
  published,
  t,
}: {
  status?: string;
  published: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const displayStatus = status || (published ? "PUBLISHED" : "DRAFT");
  const colorClass =
    status === "PUBLISHED"
      ? "bg-foreground/10 text-foreground border-foreground/20"
      : status === "CORE_BUNDLED"
      ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

  return (
    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${colorClass}`}>
      {t(`packages.lifecycle.${displayStatus}`)}
    </span>
  );
}

function PackageActionToolbar({
  pkg,
  onEditPackage,
  onTogglePublish,
  onSelectForDetail,
  onGrantPackage,
  t,
}: Omit<PackageCardItemProps, "formatPrice">) {
  return (
    <div className="pt-2 border-t border-border flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEditPackage(pkg)}
          className="h-7 px-2 text-xs font-medium gap-1 rounded-md"
        >
          <Edit className="h-3.5 w-3.5" />
          {t("packages.btn_edit")}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onTogglePublish(pkg.id || pkg.packageCode, !pkg.published)}
          className="h-7 px-2 text-xs font-medium gap-1 rounded-md text-muted-foreground hover:text-foreground"
        >
          {pkg.published ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              {t("packages.btn_unpublish")}
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              {t("packages.btn_publish")}
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSelectForDetail(pkg)}
          className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-foreground"
          title={t("packages.btn_view_details")}
        >
          <Info className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onGrantPackage(pkg)}
        className="h-7 px-2 text-xs font-medium gap-1 rounded-md bg-secondary text-secondary-foreground"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        POC
      </Button>
    </div>
  );
}

function PackageCardItem({
  pkg,
  onEditPackage,
  onTogglePublish,
  onGrantPackage,
  onSelectForDetail,
  formatPrice,
  t,
}: PackageCardItemProps) {
  const hasQuotaDelta = Boolean(
    (pkg.quotaDeltaOlt && pkg.quotaDeltaOlt > 0) ||
    (pkg.quotaDeltaOdp && pkg.quotaDeltaOdp > 0)
  );

  return (
    <Card
      key={pkg.id || pkg.packageCode}
      glowingEffect
      className="p-4 flex flex-col justify-between gap-3 bg-card border-border hover:border-primary/40 transition-colors shadow-2xs"
    >
      {/* Header: Category Badge + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 w-fit">
            {t(`packages.category.${pkg.category}`)}
          </span>
          <h3 className="text-sm font-bold text-foreground truncate mt-0.5">
            {pkg.packageName}
          </h3>
          <code className="text-[11px] font-mono text-muted-foreground">
            {pkg.packageCode}
          </code>
        </div>

        <LifecycleBadge
          status={pkg.lifecycleStatus}
          published={pkg.published}
          t={t}
        />
      </div>

      {/* Description - compact & uncluttered */}
      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
        {pkg.description || "—"}
      </p>

      {/* Price & Quota Highlights */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-mono text-muted-foreground">
            {t(`packages.billing_type.${pkg.billingType}`)}
          </span>
          <span className="text-sm font-bold font-mono text-foreground">
            {formatPrice(pkg.priceIdr, pkg.billingType)}
          </span>
        </div>

        {pkg.minimumTier && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-mono text-muted-foreground">
              {t("packages.card.min_tier")}
            </span>
            <span className="text-xs font-mono font-semibold text-primary uppercase">
              {pkg.minimumTier}
            </span>
          </div>
        )}
      </div>

      {/* Quota Boosters */}
      {hasQuotaDelta && (
        <div className="flex items-center gap-2 p-1.5 rounded bg-muted/30 border border-border/80 text-[11px] font-mono">
          <Zap className="h-3 w-3 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">{t("packages.card.quota_boost")}:</span>
          {Boolean(pkg.quotaDeltaOlt && pkg.quotaDeltaOlt > 0) && (
            <span className="text-foreground font-semibold">+{pkg.quotaDeltaOlt} OLT</span>
          )}
          {Boolean(pkg.quotaDeltaOdp && pkg.quotaDeltaOdp > 0) && (
            <span className="text-foreground font-semibold">+{pkg.quotaDeltaOdp} ODP</span>
          )}
        </div>
      )}

      {/* Prerequisites & Conflicts Badges */}
      {Boolean(
        (pkg.prerequisiteCodes && pkg.prerequisiteCodes.length > 0) ||
        (pkg.conflictCodes && pkg.conflictCodes.length > 0)
      ) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {Boolean(pkg.prerequisiteCodes && pkg.prerequisiteCodes.length > 0) && (
            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20 font-mono">
              {t("packages.card.prereq_badge")}: {pkg.prerequisiteCodes?.join(", ")}
            </span>
          )}
          {Boolean(pkg.conflictCodes && pkg.conflictCodes.length > 0) && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono flex items-center gap-1">
              <ShieldAlert className="h-2.5 w-2.5" />
              {t("packages.card.conflict_badge")}: {pkg.conflictCodes?.join(", ")}
            </span>
          )}
        </div>
      )}

      {/* Action Toolbar */}
      <PackageActionToolbar
        pkg={pkg}
        onEditPackage={onEditPackage}
        onTogglePublish={onTogglePublish}
        onSelectForDetail={onSelectForDetail}
        onGrantPackage={onGrantPackage}
        t={t}
      />
    </Card>
  );
}


