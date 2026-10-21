import * as React from "react";
import { PageHero, Card, Button, PageLayout } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Layers,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  RefreshCcw,
  Calculator,
  ShieldAlert,
} from "lucide-react";
import {
  useAllTenantSubscriptions,
  type TenantSubscriptionItem,
} from "@/hooks/useBillingSubscriptions";
import { useSubscriptionPlans, type SubscriptionPlanMaster } from "@/hooks/useSubscriptionPlans";
import { ChangePlanWizardModal } from "@/components/subscriptions/ChangePlanWizardModal";
import { TenantSubscriptionsTable } from "@/components/subscriptions/TenantSubscriptionsTable";
import { TenantProratedSimulatorCard } from "@/components/subscriptions/TenantProratedSimulatorCard";

function formatIdr(val?: number): string {
  if (typeof val !== "number" || isNaN(val) || val <= 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function TenantSubscriptionsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<"subscriptions" | "simulator">("subscriptions");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedTierFilter, setSelectedTierFilter] = React.useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>("ALL");

  // Wizard Modal state
  const [wizardOpen, setWizardOpen] = React.useState<boolean>(false);
  const [selectedSubForWizard, setSelectedSubForWizard] = React.useState<TenantSubscriptionItem | null>(null);

  // Queries
  const {
    data: subscriptions = [],
    isLoading: isSubsLoading,
    refetch: refetchSubs,
  } = useAllTenantSubscriptions();

  const { data: dbPlans = [] } = useSubscriptionPlans();

  // Metrics Calculation
  const totalCount = subscriptions.length;
  const activePayingCount = subscriptions.filter(
    (s) => (s.status === "ACTIVE" || s.status === "GRACE_PERIOD") && !s.test
  ).length;

  const productionMrr = subscriptions
    .filter((s) => (s.status === "ACTIVE" || s.status === "GRACE_PERIOD") && !s.test)
    .reduce((sum, s) => {
      const price = s.priceMonthly ? Number(s.priceMonthly) : 0;
      return sum + price;
    }, 0);

  const testCount = subscriptions.filter((s) => s.test).length;

  const expiringCount = subscriptions.filter((s) => {
    if (!s.currentPeriodEnd) return false;
    const diffDays = Math.ceil(
      (new Date(s.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  // Filtered subscriptions
  const filteredSubs = React.useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesSearch =
        searchQuery === "" ||
        s.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.organizationSlug?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier =
        selectedTierFilter === "ALL" ||
        s.planName?.toUpperCase() === selectedTierFilter.toUpperCase();

      const matchesStatus =
        selectedStatusFilter === "ALL" || s.status === selectedStatusFilter;

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [subscriptions, searchQuery, selectedTierFilter, selectedStatusFilter]);

  const handleOpenWizard = (sub: TenantSubscriptionItem) => {
    setSelectedSubForWizard(sub);
    setWizardOpen(true);
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      {/* Header Command Hero */}
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("billing.subscriptions_eyebrow")}
        title={t("billing.subscriptions_title")}
        icon={Layers}
        subtitle={t("billing.subscriptions_desc")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{activePayingCount}</span>
              <span>{t("billing.active_paying_subscriptions")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{formatIdr(productionMrr)}</span>
              <span>{t("billing.mrr_production")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{totalCount}</span>
              <span>{t("billing.total_subscriptions")}</span>
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSubs()}
              disabled={isSubsLoading}
              className="gap-1.5 h-7 px-2.5 text-xs font-medium border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCcw className={`size-3.5 ${isSubsLoading ? "animate-spin text-primary" : ""}`} />
              <span>{t("common.refresh")}</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.active_paying_subscriptions")}
            </span>
            <p className="text-2xl font-bold font-mono text-foreground">{activePayingCount}</p>
            <span className="text-[10px] text-muted-foreground">{t("billing.kpi_active_sub")}</span>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.mrr_production")}
            </span>
            <p className="text-xl font-bold font-mono text-foreground">{formatIdr(productionMrr)}</p>
            <span className="text-[10px] text-muted-foreground">{t("billing.kpi_mrr_sub")}</span>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <DollarSign className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.expiring_subscriptions")}
            </span>
            <p className={`text-2xl font-bold font-mono ${expiringCount > 0 ? "text-amber-500" : "text-foreground"}`}>
              {expiringCount}
            </p>
            <span className="text-[10px] text-muted-foreground">{t("billing.kpi_expiring_sub")}</span>
          </div>
          <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="size-4" />
          </div>
        </Card>

        <Card glowingEffect className="p-4 bg-card border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("billing.test_mode_badge")}
            </span>
            <p className="text-2xl font-bold font-mono text-muted-foreground">{testCount}</p>
            <span className="text-[10px] text-muted-foreground">{t("billing.kpi_test_sub")}</span>
          </div>
          <div className="size-9 rounded-lg bg-muted/40 border border-border flex items-center justify-center text-muted-foreground">
            <ShieldAlert className="size-4" />
          </div>
        </Card>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("subscriptions")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "subscriptions"
                ? "bg-foreground text-background font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Layers className="size-3.5" />
            <span>{t("billing.tab_active_subscriptions")}</span>
            <span className="ml-1 text-[10px] font-mono opacity-80">({filteredSubs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "simulator"
                ? "bg-foreground text-background font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Calculator className="size-3.5" />
            <span>{t("billing.tab_prorated_simulator")}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Subscriptions Table */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("billing.search_subscriptions_placeholder")}
                className="w-full h-8 pl-8 pr-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              >
                <option value="ALL">{t("billing.filter_tier_all")}</option>
                {dbPlans.map((p: SubscriptionPlanMaster) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
              >
                <option value="ALL">{t("billing.filter_status_all")}</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="GRACE_PERIOD">GRACE_PERIOD</option>
                <option value="RESTRICTED_READ_ONLY">RESTRICTED_READ_ONLY</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <TenantSubscriptionsTable
            filteredSubs={filteredSubs}
            isSubsLoading={isSubsLoading}
            onOpenWizard={handleOpenWizard}
            formatIdr={formatIdr}
          />
        </div>
      )}

      {/* TAB 2: Prorated Simulator */}
      {activeTab === "simulator" && (
        <TenantProratedSimulatorCard
          subscriptions={subscriptions}
          dbPlans={dbPlans}
          onOpenWizard={handleOpenWizard}
          formatIdr={formatIdr}
        />
      )}

      {/* Change Plan Wizard Modal */}
      <ChangePlanWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        subscription={selectedSubForWizard}
        onSuccess={() => refetchSubs()}
      />
    </PageLayout>
  );
}
