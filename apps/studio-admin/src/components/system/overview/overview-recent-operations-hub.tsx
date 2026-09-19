import { useState, useEffect } from "react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import {
  Building2,
  ShieldAlert,
  Cpu,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  RefreshCw,
  Activity,
} from "lucide-react";
import { useRecentOperations } from "@/hooks/useRecentOperations";
import type { RecentTabId } from "./recent-operations-types";
import { OrganizationsTab } from "./tabs/OrganizationsTab";
import { SecurityAuditTab } from "./tabs/SecurityAuditTab";
import { BackgroundJobsTab } from "./tabs/BackgroundJobsTab";
import { SystemAlertsTab } from "./tabs/SystemAlertsTab";
import { BillingEventsTab } from "./tabs/BillingEventsTab";

const STORAGE_KEY = "k2net-overview-recent-tab";

interface TabDefinition {
  id: RecentTabId;
  label: string;
  shortLabel?: string;
  icon: typeof Building2;
  viewAllHref: string;
  viewAllLabel: string;
  getBadgeCount: (data: ReturnType<typeof useRecentOperations>["data"]) => number;
  getBadgeVariant: (count: number) => "default" | "warning" | "danger" | "neutral";
}

const TABS: TabDefinition[] = [
  {
    id: "organizations",
    label: "Organizations",
    shortLabel: "Tenants",
    icon: Building2,
    viewAllHref: "/organizations",
    viewAllLabel: "View All Organizations",
    getBadgeCount: (d) => d.summaryCounts?.totalOrganizationsCount || d.organizations?.length || 0,
    getBadgeVariant: () => "neutral",
  },
  {
    id: "security",
    label: "Security & Audit",
    shortLabel: "Security",
    icon: ShieldAlert,
    viewAllHref: "/audit",
    viewAllLabel: "View All Audit Logs",
    getBadgeCount: (d) => d.summaryCounts?.securityWarningsCount || 0,
    getBadgeVariant: (c) => (c > 0 ? "warning" : "neutral"),
  },
  {
    id: "jobs",
    label: "Provisioning & Jobs",
    shortLabel: "Jobs",
    icon: Cpu,
    viewAllHref: "/observability/scheduler",
    viewAllLabel: "View Job Schedulers",
    getBadgeCount: (d) => d.summaryCounts?.runningJobsCount || 0,
    getBadgeVariant: (c) => (c > 0 ? "warning" : "neutral"),
  },
  {
    id: "alerts",
    label: "System Alerts",
    shortLabel: "Alerts",
    icon: AlertTriangle,
    viewAllHref: "/observability/overview",
    viewAllLabel: "Investigate Alerts",
    getBadgeCount: (d) => d.summaryCounts?.activeAlertsCount || 0,
    getBadgeVariant: (c) => (c > 0 ? "danger" : "neutral"),
  },
  {
    id: "billing",
    label: "Billing & Subscriptions",
    shortLabel: "Billing",
    icon: CreditCard,
    viewAllHref: "/organizations",
    viewAllLabel: "View Subscriptions",
    getBadgeCount: (d) => d.summaryCounts?.recentBillingEventsCount || d.billingEvents?.length || 0,
    getBadgeVariant: () => "neutral",
  },
];

import { OverviewRecentHubSkeleton } from "./skeletons";

export function OverviewRecentOperationsHub() {
  const { data, loading, refresh } = useRecentOperations();
  const [activeTab, setActiveTab] = useState<RecentTabId>("organizations");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Restore saved tab from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as RecentTabId | null;
      if (saved && TABS.some((t) => t.id === saved)) {
        setActiveTab(saved);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleTabChange = (tabId: RecentTabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem(STORAGE_KEY, tabId);
    } catch {
      // Ignore storage errors
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // If cold start loading, render seamless skeleton hub
  const isColdStart = loading && 
    data.organizations.length === 0 && 
    data.securityAudits.length === 0 && 
    data.backgroundJobs.length === 0;

  if (isColdStart) {
    return <OverviewRecentHubSkeleton />;
  }

  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section className="space-y-3.5">
      {/* Header with Title and Global Navigation Link */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Activity className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
              Unified Operations & Activity Hub
            </h2>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Monitoring real-time aktivitas tenant, audit keamanan sensitif, background jobs, serta telemetri sistem.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading || isRefreshing}
            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            title="Refresh operations stream"
          >
            <RefreshCw
              className={cn("size-3 transition-transform", (loading || isRefreshing) && "animate-spin")}
            />
            <span className="hidden md:inline">Refresh</span>
          </Button>

          <Link
            href={activeTabMeta.viewAllHref}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary group"
          >
            <span>{activeTabMeta.viewAllLabel}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Modern 5-Tab Segmented Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-card/60 border border-border scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = tab.getBadgeCount(data);
          const badgeVariant = tab.getBadgeVariant(badgeCount);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer select-none",
                isActive
                  ? "bg-primary/15 text-primary shadow-xs border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>

              {badgeCount > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[1.125rem] h-4.5 px-1 rounded-full text-[9px] font-mono font-bold leading-none border transition-colors",
                    badgeVariant === "danger"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse"
                      : badgeVariant === "warning"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : isActive
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="min-h-[140px]">
        {activeTab === "organizations" && (
          <OrganizationsTab items={data.organizations} loading={loading} />
        )}
        {activeTab === "security" && (
          <SecurityAuditTab items={data.securityAudits} loading={loading} />
        )}
        {activeTab === "jobs" && (
          <BackgroundJobsTab items={data.backgroundJobs} loading={loading} />
        )}
        {activeTab === "alerts" && (
          <SystemAlertsTab items={data.systemAlerts} loading={loading} />
        )}
        {activeTab === "billing" && (
          <BillingEventsTab items={data.billingEvents} loading={loading} />
        )}
      </div>
    </section>
  );
}
