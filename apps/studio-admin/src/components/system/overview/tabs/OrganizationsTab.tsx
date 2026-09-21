import { useMemo } from "react";
import { useRouter } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import {
  RotateCcw,
  Loader2,
  FolderKanban,
} from "lucide-react";
import type { OrganizationItem } from "../recent-operations-types";
import { useOverviewTableControls, type FilterPillOption } from "../use-overview-table-controls";
import { OverviewTabToolbar } from "../OverviewTabToolbar";
import { OverviewSortableHeader } from "../OverviewSortableHeader";
import { OrganizationContextMenu } from "@/components/organizations/OrganizationContextMenu";
import { enrichOrganization, type OrganizationStatus } from "@/components/organizations/types";

interface OrganizationsTabProps {
  items: OrganizationItem[];
  loading: boolean;
}

function getPlanBadgeStyle(tier: string): string {
  const t = (tier ?? "").toUpperCase();
  if (t === "ENTERPRISE")
    return "border-amber-500/40 bg-amber-500/10 text-amber-400";
  if (t === "PRO" || t === "PROFESSIONAL")
    return "border-primary/40 bg-primary/10 text-primary";
  if (t === "STARTER")
    return "border-sky-400/40 bg-sky-400/10 text-sky-400";
  if (t === "FREE")
    return "border-muted-foreground/25 bg-muted/20 text-muted-foreground";
  return "border-border bg-card/40 text-muted-foreground";
}

function getStatusDisplay(status: string, isTrial: boolean) {
  if (isTrial || (status ?? "").toUpperCase() === "TRIAL")
    return {
      dot: "bg-amber-400",
      label: "TRIAL",
      color: "text-amber-400",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE")
    return {
      dot: "bg-primary animate-pulse shadow-[0_0_5px_hsl(var(--primary)/0.8)]",
      label: "ACTIVE",
      color: "text-primary",
      badge: "border-primary/30 bg-primary/10 text-primary",
    };
  if (s === "OVERDUE" || s === "TRIAL_EXPIRED")
    return { 
      dot: "bg-rose-500", 
      label: s, 
      color: "text-rose-400",
      badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    };
  if (s === "SUSPENDED")
    return { 
      dot: "bg-muted-foreground", 
      label: "SUSPENDED", 
      color: "text-muted-foreground",
      badge: "border-border bg-muted/20 text-muted-foreground",
    };
  return { 
    dot: "bg-muted-foreground", 
    label: s || "UNKNOWN", 
    color: "text-muted-foreground",
    badge: "border-border bg-muted/20 text-muted-foreground",
  };
}

export function OrganizationsTab({ items, loading }: OrganizationsTabProps) {
  const router = useRouter();

  // Dynamic filter pill options
  const filterOptions = useMemo<FilterPillOption[]>(() => {
    const activeCount = items.filter((o) => (o.status ?? "").toUpperCase() === "ACTIVE" && !o.isTrial).length;
    const trialCount = items.filter((o) => o.isTrial || (o.status ?? "").toUpperCase() === "TRIAL").length;
    const overdueCount = items.filter((o) => {
      const s = (o.status ?? "").toUpperCase();
      return s === "OVERDUE" || s === "SUSPENDED" || s === "TRIAL_EXPIRED";
    }).length;

    return [
      { id: "ALL", label: "Semua", count: items.length },
      { id: "ACTIVE", label: "Active", count: activeCount, badgeVariant: "success", dotColor: "bg-primary" },
      { id: "TRIAL", label: "Trial", count: trialCount, badgeVariant: "warning", dotColor: "bg-amber-400" },
      { id: "OVERDUE", label: "Overdue", count: overdueCount, badgeVariant: "critical", dotColor: "bg-rose-500" },
    ];
  }, [items]);

  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortField,
    sortDir,
    handleSort,
    visibleItems,
    totalFilteredCount,
    totalCount,
    hasMore,
    sentinelRef,
    resetFilters,
  } = useOverviewTableControls<OrganizationItem>({
    items,
    defaultSortField: "name",
    defaultSortDir: "asc",
    initialLimit: 10,
    batchSize: 10,
    filterPredicate: (item, filter) => {
      const s = (item.status ?? "").toUpperCase();
      if (filter === "ACTIVE") return s === "ACTIVE" && !item.isTrial;
      if (filter === "TRIAL") return item.isTrial || s === "TRIAL";
      if (filter === "OVERDUE") return s === "OVERDUE" || s === "SUSPENDED" || s === "TRIAL_EXPIRED";
      return true;
    },
    searchPredicate: (item, q) => {
      return (
        (item.name ?? "").toLowerCase().includes(q) ||
        (item.slug ?? "").toLowerCase().includes(q) ||
        (item.planTier ?? "").toLowerCase().includes(q) ||
        (item.status ?? "").toLowerCase().includes(q)
      );
    },
    sortComparator: (a, b, field, dir) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (field === "name") {
        valA = a.name ?? "";
        valB = b.name ?? "";
      } else if (field === "planTier") {
        const getPlanWeight = (p?: string) => {
          const u = (p ?? "").toUpperCase();
          if (u === "ENTERPRISE") return 4;
          if (u === "PRO" || u === "PROFESSIONAL") return 3;
          if (u === "STARTER") return 2;
          return 1;
        };
        const weightA = getPlanWeight(a.planTier);
        const weightB = getPlanWeight(b.planTier);
        return dir === "asc" ? weightA - weightB : weightB - weightA;
      } else if (field === "status") {
        valA = a.isTrial ? "TRIAL" : a.status || "";
        valB = b.isTrial ? "TRIAL" : b.status || "";
      }

      if (valA < valB) return dir === "asc" ? -1 : 1;
      if (valA > valB) return dir === "asc" ? 1 : -1;
      return 0;
    },
  });

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  const handleRowClick = (org: OrganizationItem) => {
    router.push(org.id ? `/organizations/${org.id}` : `/organizations`);
  };

  return (
    <div className="space-y-3">
      {/* ── Search & Filter Toolbar ── */}
      <OverviewTabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama tenant, slug, plan tier..."
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalFilteredCount={totalFilteredCount}
        totalCount={totalCount}
        onResetFilters={resetFilters}
      />

      {/* ── Table with Infinite Scroll Container ── */}
      <div className="rounded-xl border border-border bg-card/10 overflow-hidden flex flex-col">
        <div className="max-h-[460px] overflow-auto custom-scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
              <tr className="divide-x divide-border/30">
                <th className="py-2.5 px-3.5 min-w-[200px]">
                  <OverviewSortableHeader
                    title="Organisasi / ISP"
                    field="name"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[140px]">
                  <OverviewSortableHeader
                    title="Plan Tier"
                    field="planTier"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3.5 min-w-[130px] text-center">
                  <OverviewSortableHeader
                    title="Status Langganan"
                    field="status"
                    currentSortField={sortField}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                </th>
              </tr>
            </thead>

            {/* Rows with Right-Click Context Menu & Left-Click Navigation */}
            <tbody className="divide-y divide-border/30">
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderKanban className="size-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">
                        {activeFilter !== "ALL"
                          ? `Tidak ada organisasi dengan status ${activeFilter}`
                          : "Tidak ada data organisasi ditemukan"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchQuery
                          ? `Tidak ada organisasi yang cocok dengan "${searchQuery}".`
                          : "Belum ada tenant ISP terdaftar di platform."}
                      </p>
                      {(searchQuery || activeFilter !== "ALL") && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                        >
                          <RotateCcw className="size-3" />
                          <span>Reset Filter</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleItems.map((org) => {
                  const statusInfo = getStatusDisplay(org.status, org.isTrial);
                  const enrichedOrg = enrichOrganization({
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                    status: (org.status as OrganizationStatus) || "ACTIVE",
                    subscriptionPlan: { name: org.planTier },
                    trialExpiresAt: org.isTrial ? new Date(Date.now() + 7 * 86400000).toISOString() : undefined,
                  });

                  return (
                    <OrganizationContextMenu
                      key={org.id || org.slug}
                      organization={enrichedOrg}
                      onViewDetail={(o) => router.push(o.id ? `/organizations/${o.id}` : `/organizations`)}
                    >
                      <tr
                        onClick={() => handleRowClick(org)}
                        className="hover:bg-card/90 transition-colors group cursor-pointer divide-x divide-border/20 select-none"
                      >
                        {/* Nama Tenant */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 font-bold text-primary text-xs uppercase">
                              {org.name?.charAt(0) || "O"}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block truncate max-w-[240px] group-hover:text-primary transition-colors">
                                {org.name}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground/70 block truncate max-w-[200px]">
                                {org.slug}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Plan Tier */}
                        <td className="py-3 px-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border uppercase tracking-wider",
                              getPlanBadgeStyle(org.planTier)
                            )}
                          >
                            {org.planTier || "PRO"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                              statusInfo.badge
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full shrink-0", statusInfo.dot)} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                      </tr>
                    </OrganizationContextMenu>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="py-2 flex items-center justify-center">
            {hasMore && (
              <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground font-mono">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Memuat tenant berikutnya ({visibleItems.length} / {totalFilteredCount})...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
